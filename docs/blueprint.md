# **App Name**: NereusTalk

## Core Features:

- App Title Display: Display a large label at the top with the text "Nereus Glove Translator".
- Message Display: Create a large output text area to display the received message.
- Bluetooth Connect Button: Add a button to connect to Bluetooth using the Web Bluetooth API with the text "🔗 Connect Glove".
- Bluetooth Communication: Implement Bluetooth functionality to receive text messages from the Arduino/ESP32 glove.
- Subtitle output: Add real-time subtitle display under the voice button. Display translated messages in real-time as subtitles while the speech is output.
- Text-to-Speech: Utilize Text-to-Speech (TTS) to speak the received message aloud.

## Style Guidelines:

- Background color: Dark desaturated blue-grey (#212936), to follow the color cues of the example images provided, which are mostly monochrome in a dark scheme. This conveys the desired modern look.
- Primary color: Bright orange (#FFA500), as a high-contrast complement to the desaturated background color. Also conveys some of the look of the image provided.
- Accent color: Muted lavender (#B284BE), as a quieter analog to the bright orange primary. The light color helps to further highlight text.
- Font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look. Suitable for both headlines and body text. Note: currently only Google Fonts are supported.
- Rounded corners for all buttons and text areas.
- Soft shadows for a modern, soft look.
- Use simple, line-based icons for Bluetooth and other functionalities. To convey the 'lovable' interface style requested, consider designing the icons with rounded ends and slightly thicker lines.
- A subtle loading animation can be shown while waiting for the glove to connect.