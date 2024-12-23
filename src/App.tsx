import {Container, Grid2, LinearProgress, Link, Paper, Stack, Typography} from "@mui/material";
import {Done, Info, ScreenShare, Videocam} from "@mui/icons-material";
import PlaydateConnection, {ConnectedPlaydate} from "./PlaydateConnection.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import Quantization from "./Quantization.tsx";
import VideoCapture, {CaptureConfig, CaptureConfigAndSource, DEFAULT_CAPTURE_CONFIG} from "./VideoCapture.tsx";
import {apply_quantization, DEFAULT_QUANTIZATION_CONFIG, QuantizationConfig} from "./imageQuantization.ts";
import About from "./About.tsx";

async function processFrame(videoElem: HTMLVideoElement, canvasElem: HTMLCanvasElement, captureConfig: CaptureConfig, quantizationConfig: QuantizationConfig, device?: ConnectedPlaydate) {
    const {width, height} = canvasElem;

    const ctx = canvasElem.getContext('2d', {willReadFrequently: true});
    if (!ctx) {
        return 'error';
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(videoElem, captureConfig.x, captureConfig.y, captureConfig.w, captureConfig.h, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    apply_quantization(quantizationConfig, imageData);
    ctx.putImageData(imageData, 0, 0);

    if (device && !device.device.isBusy) {
        const data = imageData.data;
        const bw_data = new Uint8Array(width * height).fill(1);
        for (let i = 0; i < data.length; i += 4) {
            bw_data[i / 4] = data[i] == 0 ? 0 : 1;
        }

        await device.device.sendBitmapIndexed(bw_data)
        return 'device';
    }

    return 'no-device';
}


function App() {
    const [connectedDevice, setConnectedDevice] = useState<ConnectedPlaydate | undefined>(undefined);
    const [captureConfigAndSource, setCaptureConfigAndSource] = useState<CaptureConfigAndSource>({captureConfig: DEFAULT_CAPTURE_CONFIG})
    const [quantizationConfig, setQuantizationConfig] = useState(DEFAULT_QUANTIZATION_CONFIG);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isProcessing = useRef(false);
    const fpsSnapshot = useRef({seconds: new Date().getTime() / 1000, totalFrames: 0});

    const doProcessFrame = useCallback(async () => {
        if (isProcessing.current || !canvasRef.current || !videoRef.current) {
            return false;
        }
        isProcessing.current = true;
        try {
            await processFrame(videoRef.current, canvasRef.current, captureConfigAndSource.captureConfig, quantizationConfig, connectedDevice);
            if (connectedDevice) {
                const timestamp = new Date().getTime() / 1000;
                const newFPSSnapshot = timestamp - fpsSnapshot.current.seconds >= 1;
                let lastSecondFramesSent = connectedDevice.lastSecondFramesSent;
                if (newFPSSnapshot) {
                    lastSecondFramesSent = connectedDevice.totalFramesSent - fpsSnapshot.current.totalFrames + 1;
                    fpsSnapshot.current = {seconds: timestamp, totalFrames: connectedDevice.totalFramesSent};
                }

                setConnectedDevice({
                    ...connectedDevice,
                    lastSecondFramesSent,
                    totalFramesSent: connectedDevice.totalFramesSent + 1
                });
            }

        } finally {
            isProcessing.current = false;
        }
        return true;
    }, [captureConfigAndSource.captureConfig, quantizationConfig, connectedDevice, videoRef, canvasRef]);

    useEffect(() => {
        if (captureConfigAndSource.mediaStream) {
            const interval = setInterval(async () => {
                await doProcessFrame();
            }, 1000 / 40); // throttled inside doProcessFrame()
            return () => clearInterval(interval);
        } else {
            if (connectedDevice && connectedDevice.lastSecondFramesSent != 0) {
                setConnectedDevice({...connectedDevice, lastSecondFramesSent: 0})
            }
        }
    }, [doProcessFrame, captureConfigAndSource.mediaStream, connectedDevice]);

    return (
        <>
            {/*<Button onClick={() => doProcessFrame()}>Process Frame</Button>*/}
            <Stack
                direction="column"
                spacing={2}
                margin={1}
            >
                <Paper>
                    <Container>
                        <h1><Info/> About Playdate AntiMirror</h1>
                        <About />
                    </Container>
                </Paper>
                <Paper>
                    <Container>
                        <h1><Videocam/> Capture Content {captureConfigAndSource.mediaStream && <Done color="primary"/>}
                        </h1>
                        <Grid2 container spacing={2} marginBottom={2}>
                            <Grid2 size={6}>
                                <VideoCapture videoRef={videoRef} configAndSource={captureConfigAndSource}
                                              onchange={setCaptureConfigAndSource}/>
                            </Grid2>
                            <Grid2 size={6}>
                                <Quantization canvasRef={canvasRef} quantizationConfig={quantizationConfig}
                                              onchange={setQuantizationConfig}
                                              active={!!captureConfigAndSource.mediaStream}/>
                            </Grid2>
                        </Grid2>

                    </Container>
                </Paper>
                <Paper>
                    <Container><h1><ScreenShare/> Connect to Playdate {connectedDevice?.device &&
                        <Done color="primary"/>}</h1>
                        {connectedDevice && connectedDevice.lastSecondFramesSent > 0 &&
                            <LinearProgress color="primary"/>}
                        <PlaydateConnection device={connectedDevice} onChange={setConnectedDevice}/>
                    </Container>
                </Paper>


            </Stack>
            <Typography sx={{textAlign: 'center'}} marginTop={5}>
                <Link
                    href="/">
                    Playdate AntiMirror</Link> was made by <Link href="https://HeikoBehrens.com">Heiko</Link> during
                the <Link href={"https://memfault.com/about/"}>Memfault</Link> Awesome Day hackathon on 2024-12-20.
                <br/>
                This tool is not affiliated with <Link href="https://panic.com">Panic</Link>.
            </Typography>
        </>
    )
}

export default App
