import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        text: {
            primary: '#DDDDDD'
        },
        background: {
            default: '#212223',
        },
        primary: {
            main: '#FFC500',
        },
        secondary: {
            main: '#B1AFA7',
        }

    },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={darkTheme}>
        <CssBaseline>
            <div >
                <App/>
            </div>
        </CssBaseline>
        </ThemeProvider>
    </StrictMode>,
)
