// Quick test to verify API key works
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function testAPIKey() {
  console.log('🔍 Testing API Key...');

  try {
    const model = google('gemini-2.5-flash', {
      apiKey: 'AIzaSyA3JOFk4ZL7jiTtd-eodK_LgNS-nG0OcSI'
    });

    const result = await generateText({
      model,
      prompt: 'Say "API key working!" in a fun way.'
    });

    console.log('✅ SUCCESS: API Key is working!');
    console.log('🤖 Response:', result.text);
    return true;

  } catch (error) {
    console.error('❌ API Key Error:', error.message);
    return false;
  }
}

testAPIKey();
