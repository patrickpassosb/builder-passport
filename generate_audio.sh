#!/bin/bash
API_KEY="sk_2003ae770ab48e6893cb4a9aa7d103dbfb30c22d3c9674d1"
VOICE_ID="pNInz6ovSY9y16K6f8mX" # Adam
TEXT="Every hackathon achievement usually becomes just a social media post and then fades away. Builder Passport changes that. It's an on-chain reputation layer built on Monad, where your milestones become permanent, verifiable credentials.

Each event is registered on-chain. Here's Monad Blitz Sao Paulo. Builders can attest their peers across categories like Technical, Product, or Teamwork. One click on Monad, and the endorsement is recorded forever, proving your impact.

This is the result: a Builder Passport. It aggregates your full history from awards like 'Monad Blitz Berlin Winner' and peer attestations. An AI-generated summary, built directly from on-chain data, tells your professional story accurately and objectively.

You can also import previous wins from other platforms, verified by your peers. This reputation is fully composable, ready for any DAO or protocol to verify your skills.

Builder Passport: Your reputation, portable and permanent. Forever."

curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
     -H "xi-api-key: $API_KEY" \
     -H "Content-Type: application/json" \
     -d "{
  \"text\": \"$(echo $TEXT | tr '\n' ' ')\",
  \"model_id\": \"eleven_multilingual_v2\",
  \"voice_settings\": {
    \"stability\": 0.5,
    \"similarity_boost\": 0.5
  }
}" -o /home/patrickpassos/GitHub/work/builder-passport/demo_audio.mp3
