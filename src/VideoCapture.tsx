// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture#options_and_constraints
import {Suspense, useEffect, useRef, useState, use} from "react";
import "./VideoCapture.css";
import {PDVersion, PlaydateDevice, requestConnectPlaydate} from 'pd-usb';

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

async function processFrame(videoElem: HTMLVideoElement, canvasElem: HTMLCanvasElement, captureConfig: CaptureConfig, device?: TargetDevice) {
    const {width, height} = canvasElem;

    const ctx = canvasElem.getContext('2d', {willReadFrequently: true});
    if (!ctx) {
        return;
    }
    ctx.drawImage(videoElem, captureConfig.x, captureConfig.y, captureConfig.w, captureConfig.h, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const bw_data = new Uint8Array(width * height).fill(1);
    for (let i = 0; i < data.length; i += 4) {
        // https://stackoverflow.com/a/52879332
        const lum = 0.2126 * data[i]
            + 0.7152 * data[i + 1]
            + 0.0722 * data[i + 2];

        // for now, this is clamp only
        const bw = lum > 128 ? 255 : 0;
        bw_data[i / 4] = bw == 0 ? 0 : 1;

        data[i] = bw;
        data[i + 1] = bw;
        data[i + 2] = bw;
        data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    if (device) {
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

function VideoCapture() {
    const [capturing, setCapturing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [processContinuously, setProcessContinuously] = useState(false);
    const [playdateDevice, setPlaydateDevice] = useState<TargetDevice | undefined>(undefined);

    const doProcessFrame = async () => {
        if (videoRef.current && canvasRef.current) {
            const captureConfig: CaptureConfig = MACOS_PLAYDATE_SIMULATOR;
            await processFrame(videoRef.current, canvasRef.current, captureConfig, playdateDevice);
        }
    };

    const framesSinceLastSecond = useRef(0);
    useEffect(() => {
        if (!processContinuously) {
            return;
        }
        framesSinceLastSecond.current = 0;
        let isProcesing = false;
        const interval = setInterval(async () => {
            if (isProcesing) return;
            isProcesing = true;
            try {
                await doProcessFrame();
                framesSinceLastSecond.current = framesSinceLastSecond.current + 1;
            } finally {
                isProcesing = false;
            }
        }, 1000 / 30); // TODO: use the async
        return () => clearInterval(interval);
    }, [processContinuously]);

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
            <button onClick={() => {
                if (videoRef.current) {
                    stopCapture(videoRef.current);
                }
                setCapturing(false);
            }}>Stop Capture</button> :
            <button onClick={async () => {
                if (videoRef.current) {
                    setCapturing(await startCapture(videoRef.current));
                }
            }}>Start Capture</button>
        }
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
                setPlaydateDevice({
                    device,
                    version: await device.getVersion(),
                });
            }}
        >Connect Playdate

        </button>
        {playdateDevice && <PlaydateDeviceDetails device={playdateDevice}/>
        }
    </div>;
}

export default VideoCapture;
