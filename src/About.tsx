import {Box, Link} from "@mui/material";

function About() {
    return <Box>
        <p>
            <Link href="/">Playdate AntiMirror</Link> allows you to stream pixel content from your computer screen
            directly to the Playdate gaming console via USB.
            In that sense, it's the exact opposite of the fabulous <Link href="https://play.date/mirror/">Playdate
            Mirror</Link>.
        </p>
        <ul>
            <li>
                <b>As a designer</b>, use it to continuously review your art on the real device in real time without
                leaving
                Aseprite, Photoshop, Gimp, Rive, or your graphics/animation tool of choice.
                Open your content in a secondary window at 100% zoom, capture its content, and keep working.
            </li>
            <li>
                <b>As a developer,</b> use it to quickly check the appearance of your game on the real thing.
                You can keep developing with Playdate's simulator or your custom game editor for quick iteration and debugging,
                while looking at the output in real time!

            </li>
        </ul>
    </Box>
}

export default About;
