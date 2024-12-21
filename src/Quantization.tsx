import {RefObject} from "react";
import {DEFAULT_QUANTIZATION_CONFIG, QuantizationConfig} from "./imageQuantization.ts";
import {MenuItem, Select} from "@mui/material";

function ConversionConfigElem({config, onChange, disabled}: {
    config: QuantizationConfig,
    disabled: boolean,
    onChange: (c: QuantizationConfig) => void
}) {
    // TODO: make typesafe
    return <Select disabled={disabled} value={config.kind} size="small" onChange={e => {
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
                return onChange(DEFAULT_QUANTIZATION_CONFIG)
        }
    }}
    >
        <MenuItem value={"threshold"}> Threshold </MenuItem>
        <MenuItem value={"bayer"}>Bayer 4x4</MenuItem>
        <MenuItem value={"floydsteinberg"}>FloydSteinberg</MenuItem>
        <MenuItem value={"atkinson"}>Atkinson</MenuItem>
    </Select>
}

interface Props {
    quantizationConfig: QuantizationConfig,
    active: boolean
    canvasRef?: RefObject<HTMLCanvasElement | null>,
    onchange: (config: QuantizationConfig) => void,
}


function Quantization(props: Props) {
    return <>
        <canvas ref={props.canvasRef} width={400} height={240}
                style={{
                    width: '100%',
                    border: '1px solid gray',
                    borderRadius: '5px',
                    opacity: props.active ? 1 : 0.2
                }}/>
        {
            <ConversionConfigElem disabled={!props.active} config={props.quantizationConfig} onChange={props.onchange}/>
        }
    </>;
}

export default Quantization;
