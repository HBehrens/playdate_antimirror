import {RefObject, useEffect} from "react";
import Button from "@mui/material/Button";
import {Grid2, Slider} from "@mui/material";

// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture#options_and_constraints

async function startCapture(videoElem: HTMLVideoElement) {
    const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
            displaySurface: "window",
            frameRate: 25,
        },
        audio: false,
    };
    const r = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    console.log("start capture", r);
    videoElem.srcObject = r;
    return r;
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

export interface CaptureConfig {
    x: number,
    y: number,
    w: number,
    h: number,
}

const MACOS_PLAYDATE_SIMULATOR_CAPTURE_CONFIG: CaptureConfig = {
    x: 16,
    y: 15,
    w: 400,
    h: 240,
};

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_CAPTURE_CONFIG: CaptureConfig = MACOS_PLAYDATE_SIMULATOR_CAPTURE_CONFIG;


export interface CaptureConfigAndSource {
    captureConfig: CaptureConfig,
    mediaStream?: MediaStream,
}

interface Props {
    configAndSource: CaptureConfigAndSource,
    videoRef: RefObject<HTMLVideoElement | null>,
    onchange: (v: CaptureConfigAndSource) => void,
}

function VideoCapture(props: Props) {

    // pretty convoluted way to re-attaching srcObject asynchronously on remount
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (props.videoRef.current && props.configAndSource.mediaStream) {
                props.videoRef.current.srcObject = props.configAndSource.mediaStream;
                await props.videoRef.current.play();
            }
        }, 0);
        return () => {
            clearTimeout(timeout)
        }

    }, [props.videoRef, props.configAndSource.mediaStream]);

    const isCapturing = !!props.configAndSource.mediaStream;

    const videoElem = <video ref={props.videoRef} id="video" key="video" autoPlay preload="none" muted width={400}
                             height={240}
                             style={{
                                 width: '100%',
                                 border: '1px solid gray',
                                 borderRadius: '5px',
                                 opacity: isCapturing ? 1 : 0.2,
                             }}
    ></video>;

    if (isCapturing) {
        const cc = props.configAndSource.captureConfig;

        function SliderGridItems(key: keyof CaptureConfig, max: number) {
            return <>
                <Grid2 textAlign="center" size={1}>{key.toUpperCase()}</Grid2>
                <Grid2 size={5}>
                    <Slider
                        size="small"
                        value={cc[key]}
                        min={0}
                        max={max}
                        valueLabelDisplay="auto"
                        onChange={(_, v) => {
                            const newCC = {...cc, [key]: v as number};
                            props.onchange({...props.configAndSource, captureConfig: newCC});
                        }}
                    /></Grid2>
            </>;
        }

        // TODO: generalize
        const videoSize = {w: 2000, h: 2000};

        return <> {videoElem}
            <Grid2 container>
                {SliderGridItems("x", videoSize.w)}
                {SliderGridItems("w", videoSize.w)}
                {SliderGridItems("y", videoSize.h)}
                {SliderGridItems("h", videoSize.h)}
            </Grid2>
            <Button variant="outlined" color="secondary" onClick={() => {
                if (props.videoRef.current) {
                    stopCapture(props.videoRef.current);
                    props.onchange({...props.configAndSource, mediaStream: undefined});
                }
            }}>Stop Capturing</Button>
        </>
    } else {
        return <>
            {videoElem}
            <Button variant="contained" onClick={async () => {
                if (props.videoRef.current) {
                    const mediaStream = await startCapture(props.videoRef.current);
                    if (mediaStream) {
                        // be prepared for screensharing to end externally (e.g. user aborts via OS features)
                        mediaStream.getTracks()[0].onended = () => props.onchange({
                            ...props.configAndSource,
                            mediaStream: undefined
                        });
                        props.onchange({...props.configAndSource, mediaStream: mediaStream});
                    }
                }


            }}>Start Capture</Button>
        </>;
    }
}

export default VideoCapture;
