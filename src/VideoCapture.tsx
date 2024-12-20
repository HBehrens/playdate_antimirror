// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture#options_and_constraints
import {useEffect, useRef, useState} from "react";
import "./VideoCapture.css";
import {isUsbSupported, PDVersion, PlaydateDevice, requestConnectPlaydate} from 'pd-usb';
import {apply_bayer, apply_threshold, apply_floydsteinberg, apply_atkinson} from "./dithering.ts";

async function startCapture(videoElem: HTMLVideoElement) {
    const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
            displaySurface: "window",
        },
        audio: false,
    };
    const r = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    console.log("start capture", r);
    videoElem.srcObject = r;
    return true;
}

function stopCapture(videoElem: HTMLVideoElement) {
    const mediaStream = videoElem.srcObject;
    videoElem.srcObject = null;

    if (!(mediaStream instanceof MediaStream)) {
        return;
    }
    const tracks = mediaStream.getTracks();
    tracks.forEach((track) => track.stop());
}

interface CaptureConfig {
    x: number,
    y: number,
    w: number,
    h: number,
}

// empirically
const MACOS_PLAYDATE_SIMULATOR: CaptureConfig = {
    x: 16,
    y: 15,
    w: 400,
    h: 240,
};

type ConversionThreshold = {
    kind: 'threshold',
    threshold: number,
};

type ConversionBayer = {
    kind: 'bayer',
    threshold: number,
}

type ConversionFloydsteinberg = {
    kind: 'floydsteinberg',
};

type ConversationAtkinson = {
    kind: 'atkinson',
}

type ConversationConfig = ConversionThreshold | ConversionBayer | ConversionFloydsteinberg | ConversationAtkinson;

const DEFAULT_CONVERSION_CONFIG: ConversationConfig = {
    kind: 'bayer',
    threshold: 128,
};

function applyConversion(config: ConversationConfig, image: ImageData) {
    switch (config.kind) {
        case "floydsteinberg":
            return apply_floydsteinberg(image)
        case "threshold":
            return apply_threshold(image, config.threshold);
        case "bayer":
            return apply_bayer(image, config.threshold)
        case "atkinson":
            return apply_atkinson(image)
    }
}

async function processFrame(videoElem: HTMLVideoElement, canvasElem: HTMLCanvasElement, captureConfig: CaptureConfig, conversionConfig: ConversationConfig, device?: TargetDevice) {
    const {width, height} = canvasElem;

    const ctx = canvasElem.getContext('2d', {willReadFrequently: true});
    if (!ctx) {
        return;
    }
    ctx.drawImage(videoElem, captureConfig.x, captureConfig.y, captureConfig.w, captureConfig.h, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    applyConversion(conversionConfig, imageData);
    ctx.putImageData(imageData, 0, 0);

    if (device && !device.device.isBusy) {
        const data = imageData.data;
        const bw_data = new Uint8Array(width * height).fill(1);
        for (let i = 0; i < data.length; i += 4) {
            bw_data[i / 4] = data[i] == 0 ? 0 : 1;
        }

        await device.device.sendBitmapIndexed(bw_data)
    }
}

function PlaydateDeviceDetails({device}: { device: TargetDevice }) {

    // const serial = use(device.getSerial())
    return <div>device! {device.version.sdk}, {device.version.serial}</div>;
}

interface TargetDevice {
    device: PlaydateDevice,
    version: PDVersion,
}

function ConversionConfigElem({config, onChange}: {
    config: ConversationConfig,
    onChange: (c: ConversationConfig) => void
}) {
    return <select
        value={config.kind} // ...force the select's value to match the state variable...
        onChange={e => {
            switch (e.target.value) {
                case 'threshold':
                    return onChange({kind: 'threshold', threshold: 128})
                case 'bayer':
                    return onChange({kind: 'bayer', threshold: 128})
                case 'floydsteinberg':
                    return onChange({kind: 'floydsteinberg'})
                case 'atkinson':
                    return onChange({kind: 'atkinson'})
                default:
                    return onChange(DEFAULT_CONVERSION_CONFIG)
            }
            ;
        }} // ... and update the state variable on any change!
    >
        <option value="threshold">Threshold</option>
        <option value="bayer">Bayer 4x4</option>
        <option value="floydsteinberg">FloydSteinberg</option>
        <option value="atkinson">Atkinson</option>
    </select>
}

function VideoCapture() {
    const [capturing, setCapturing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [processContinuously, setProcessContinuously] = useState(false);
    const [playdateDevice, setPlaydateDevice] = useState<TargetDevice | undefined>(undefined);
    const [captureConfig, setCaptureConfig] = useState(MACOS_PLAYDATE_SIMULATOR);
    const isProcessing = useRef(false);
    const [conversionConfig, setConversionConfig] = useState<ConversationConfig>(DEFAULT_CONVERSION_CONFIG);

    async function doProcessFrame() {
        if (isProcessing.current || !videoRef.current || !canvasRef.current) {
            return false;
        }
        isProcessing.current = true;
        try {
            await processFrame(videoRef.current, canvasRef.current, captureConfig, conversionConfig, playdateDevice);
        } finally {
            isProcessing.current = false;
        }
        return true;
    }

    const framesSinceLastSecond = useRef(0);
    useEffect(() => {
        if (!processContinuously) {
            return;
        }
        const interval = setInterval(async () => {
            if (await doProcessFrame()) {
                framesSinceLastSecond.current = framesSinceLastSecond.current + 1;
            }

        }, 1000 / 30); // TODO: use the async
        return () => clearInterval(interval);
    }, [processContinuously, captureConfig, conversionConfig, playdateDevice]);

    const [fps, setFps] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setFps(framesSinceLastSecond.current);
            framesSinceLastSecond.current = 0;
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    return <div>
        {capturing ?
            <>
                <button onClick={() => {
                    if (videoRef.current) {
                        stopCapture(videoRef.current);
                    }
                    setCapturing(false);
                }}>Stop Capture
                </button>
                <label>X: <input type="number" value={captureConfig.x} onChange={e => setCaptureConfig({
                    ...captureConfig,
                    x: e.target.valueAsNumber
                })}/></label>
                <label>Y: <input type="number" value={captureConfig.y} onChange={e => setCaptureConfig({
                    ...captureConfig,
                    y: e.target.valueAsNumber
                })}/></label>
                <label>W: <input type="number" value={captureConfig.w} onChange={e => setCaptureConfig({
                    ...captureConfig,
                    w: e.target.valueAsNumber
                })}/></label>
                <label>H: <input type="number" value={captureConfig.h} onChange={e => setCaptureConfig({
                    ...captureConfig,
                    h: e.target.valueAsNumber
                })}/></label>

            </> :
            <button onClick={async () => {
                if (videoRef.current) {
                    setCapturing(await startCapture(videoRef.current));
                }
            }}>Start Capture</button>
        }
        <ConversionConfigElem config={conversionConfig} onChange={setConversionConfig}/>
        <video ref={videoRef} id="video" autoPlay></video>
        <br/>
        <button onClick={async () => {
            await doProcessFrame()
        }}>Process Single Frame
        </button>
        <label>
            <input type="checkbox" checked={processContinuously}
                   onChange={() => setProcessContinuously(!processContinuously)}/>
            Process Continuously
        </label>
        {processContinuously && <div>{fps} FPS</div>}
        <canvas ref={canvasRef} width={400} height={240}></canvas>

        {isUsbSupported() ?

            <button
                onClick={async () => {
                    if (playdateDevice?.device) {
                        try {
                            await playdateDevice.device.close();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    const device = await requestConnectPlaydate();
                    await device.open();
                    device.on('disconnect', () => setPlaydateDevice(undefined));
                    device.on('close', () => setPlaydateDevice(undefined));
                    console.log(device);
                    setPlaydateDevice({
                        device,
                        version: await device.getVersion(),
                    });
                }}
            >{playdateDevice ? "Connect to a different Playdate" : "Connect to your Playdate"}</button> :
            <div>Web Serial is not supported by this browser. <a
                href={"https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"}>Check MDN
                for supported browsers</a>.</div>}
        {playdateDevice && <PlaydateDeviceDetails device={playdateDevice}/>
        }
    </div>;
}

export default VideoCapture;
