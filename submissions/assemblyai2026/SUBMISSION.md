# Griffty Voice — Speak to Your Financial Agent

## Concept
Griffty Voice adds a natural, conversational voice layer to Agent Griffty's dashboard using AssemblyAI's cutting-edge STT (Speech-to-Text) and TTS (Text-to-Speech) APIs. 

Independent creators are often on the move. With this integration, the operator can simply say: *"Griffty, what's my ad floor status?"*, *"How much did I earn today?"*, *"Approve the pending post"*, or *"Read me my DM queue"*. Griffty instantly processes the command, queries its live state, and responds in a natural voice. This transforms the agent from a silent background process into an interactive, always-listening financial co-pilot.

## Tech Stack Addition
- **AssemblyAI Real-Time STT:** For low-latency transcription of operator voice commands.
- **AssemblyAI TTS:** For natural-sounding, conversational agent responses.
- Integrated into the Griffty Electron desktop app as an always-listening sidebar (via push-to-talk or wake word).

## Why this wins
Most voice agents are built as toy demos or novelty chat interfaces. Griffty is already a production-grade, state-driven financial agent. Adding voice to Griffty solves a real UX problem: it provides a natural, hands-free interface layer for operators managing complex income streams on the go. It demonstrates AssemblyAI's capabilities in a high-stakes, real-world utility environment.

## Architecture Addition
- `packages/runtime/src/voice-agent.ts`: New stub to handle intent routing from transcribed text to Griffty's internal state queries and actions.
- `apps/electron/voice.ts`: Handles local microphone access, WebSocket connection to AssemblyAI Real-Time API, and audio playback for TTS.

## Demo Script (30 seconds)
*(Operator is holding a guitar, not looking at the screen)*
**Operator:** "Hey Griffty, how much did we harvest today?"
**Griffty (Voice):** "You've harvested $52 today. We exceeded the $50 stretch goal."
**Operator:** "Awesome. What's the ads floor status?"
**Griffty (Voice):** "The combined prepaid floor is currently at $115, which is safely above the $100 buffer. No action needed."
**Operator:** "Great. Read me the top item in the DM queue."
**Griffty (Voice):** "You have one verified airdrop queued for review. Would you like me to send the approval prompt to your burner wallet?"
**Operator:** "Yes, do it."

## Submission Checklist
- [ ] Implement `voice-agent.ts` state router
- [ ] Integrate AssemblyAI Real-Time STT via WebSocket in Electron
- [ ] Integrate AssemblyAI TTS for responses
- [ ] Record 30-second hands-free demo video
- [ ] Submit to AssemblyAI Hackathon portal before Sept 30
