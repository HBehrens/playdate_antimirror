import {isUsbSupported, PDVersion, PlaydateDevice, requestConnectPlaydate} from "pd-usb";
import {Alert, Box, Card, CardContent, Link, Stack, Typography} from "@mui/material";
import Button from "@mui/material/Button";

export interface ConnectedPlaydate {
    device: PlaydateDevice,
    version: PDVersion,
    totalFramesSent: number,
    lastSecondFramesSent: number,
}

export interface Props {
    device?: ConnectedPlaydate,
    onChange: (device?: ConnectedPlaydate) => void,
}

async function connectToPlaydate(connectedDevice: ConnectedPlaydate | undefined, setConnectedDevice: (d?: ConnectedPlaydate) => void) {
    if (connectedDevice) {
        try {
            await connectedDevice.device.close();
        } catch (e) {
            console.error(e);
        }
    }
    const device = await requestConnectPlaydate();
    await device.open();
    device.on('disconnect', () => setConnectedDevice(undefined));
    device.on('close', () => setConnectedDevice(undefined));
    console.log(device);
    setConnectedDevice({
        device,
        version: await device.getVersion(),
        totalFramesSent: 0,
        lastSecondFramesSent: 0,
    });
}

function PlaydateConnection(props: Props) {
    const doConnect = async () => {
        await connectToPlaydate(props.device, props.onChange)
    };

    if (props.device) {
        const deviceDesk = [
            {
                key: 'Serial',
                desc: props.device.version.serial,
            },
            {
                key: 'Version',
                desc: props.device.version.sdk,
            },
            {
                key: 'Frames Sent',
                desc: `${props.device.totalFramesSent} (${props.device.lastSecondFramesSent} fps)`,
            },
        ];

        return <Box marginBottom={2}>
            <Stack direction="row" spacing={1}>
                {deviceDesk.map((d) => (
                    <Card key={d.key}><CardContent>
                        <Typography gutterBottom variant="h6" component="div">
                            {d.key}
                        </Typography>
                        <Typography gutterBottom variant="body2" component="div">
                            {d.desc}
                        </Typography>
                    </CardContent></Card>
                ))}

            </Stack>
            <Button variant="outlined" color="secondary" onClick={doConnect}>Connect to another Playdate</Button>
        </Box>
    } else {
        if (isUsbSupported()) {
            return <Box marginBottom={2}>
                <p>Make sure your Playdate is connected via USB and unlocked.</p>
                <Button variant="contained" onClick={doConnect}>Connect to your Playdate</Button>
            </Box>;
        } else {
            return <Box><Alert severity="error">Web Serial is not supported by this browser and streaming will not work.
                Please&nbsp;
                <Link color="secondary"
                    href={"https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"}>
                    Check MDN to find a compatible  browser</Link>.</Alert>
            </Box>;



        }
    }
}

export default PlaydateConnection;
