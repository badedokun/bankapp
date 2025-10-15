# Voice-Activated Transfer Flow

## Date: October 13, 2025

## Overview

The conversational transfer flow works seamlessly with **both text and voice input**. Users can complete entire transfers using voice commands, with automatic speech-to-text conversion.

## How It Works

### Architecture

```
Voice Input → Speech Recognition API → Text → Same Transfer Flow → Response
Text Input → Text → Same Transfer Flow → Response
```

**Key Point:** Voice and text use the **exact same backend flow**. The voice is simply converted to text first.

### Implementation

```typescript
// Voice input handler
recognition.onresult = (event: any) => {
  const transcript = event.results[0][0].transcript;
  if (event.results[0].isFinal) {
    setInputText(transcript);
    handleSendMessage(transcript);  // ← Same function as text!
    setVoiceMode('off');
  }
};
```

## Voice Transfer Example

### Complete Voice-Only Transfer

```
👤 User: 🎤 "Transfer money"
🤖 AI: "Great! Let's start your transfer. How much would you like to send?"

👤 User: 🎤 "Five thousand naira"
🤖 AI: "Please enter the recipient's account number (10 digits):"

👤 User: 🎤 "Zero one two three four five six seven eight nine"
🤖 AI: "Which bank is the recipient's account with?"

👤 User: 🎤 "Access Bank"
🤖 AI: "✅ Account verified!
     Recipient: John Doe
     Account: 0123456789
     Bank: Access Bank
     Amount: ₦5,000

     Would you like to add a description?"

👤 User: 🎤 "Skip"
🤖 AI: "Please enter your 4-digit transaction PIN to complete the transfer:"

👤 User: 🔒 [Voice disabled for security - must type PIN]
     ⌨️ Types: 2348

🤖 AI: "✅ Transfer Successful!
     Amount: ₦5,000
     Recipient: John Doe
     Reference: 5133301K7FKJQGDDAE52B3E83"
```

## Voice Recognition Features

### Natural Language Processing

The system understands various ways to express the same thing:

**Amount:**
- "Five thousand" → 5000
- "Five thousand naira" → 5000
- "5000" → 5000
- "Five zero zero zero" → 5000

**Account Numbers:**
- "Zero one two three four five six seven eight nine" → 0123456789
- "0 1 2 3 4 5 6 7 8 9" → 0123456789

**Bank Names:**
- "Access Bank" ✅
- "Access" ✅
- "GTBank" ✅
- "Guaranty Trust Bank" ✅

**Actions:**
- "Skip" ✅
- "Skip description" ✅
- "No description" ✅
- "Continue" ✅

## Security: PIN Entry Protection

### Why Voice is Disabled for PIN

For **security reasons**, voice input is automatically disabled when the system requests a PIN:

```typescript
const toggleVoiceRecording = () => {
  // Disable voice input during PIN entry for security
  if (isAwaitingPin) {
    notify.info('For security, please type your PIN instead of speaking it', 'Security Notice');
    return;
  }
  // ... normal voice handling
};
```

### Visual Indicators

When PIN entry is required:
- 🔒 Voice button shows **lock icon**
- ⚫ Voice button is **grayed out** and disabled
- ⌨️ Numeric keyboard appears for typing
- 🔢 PIN is **masked** with dots
- 📱 Haptic feedback on mobile

### Why This Matters

| Scenario | Risk | Protection |
|----------|------|------------|
| Speaking PIN in public | Others can hear PIN | Voice disabled ✅ |
| Speaking PIN near microphone | Could be recorded | Voice disabled ✅ |
| Multiple people present | PIN exposure | Voice disabled ✅ |
| Video calls/recordings | PIN in audio | Voice disabled ✅ |

## Browser Support

### Speech Recognition API Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best performance |
| Edge | ✅ Full | Chromium-based |
| Safari | ✅ Partial | iOS 14.5+ |
| Firefox | ❌ No | Not supported |
| Opera | ✅ Full | Chromium-based |

### Fallback Handling

If voice is not available:
```typescript
if (!speechRecognition) {
  notify.info('Voice recognition is not available in your browser', 'Info');
  return;
}
```

Users can always use text input as a fallback.

## Voice Input Best Practices

### For Users

**✅ DO:**
- Speak clearly and at normal pace
- Use natural language (no need to be robotic)
- Speak in a quiet environment
- Check the transcription before sending
- Use text for PIN entry

**❌ DON'T:**
- Speak your PIN aloud
- Use voice in noisy environments
- Rush through words
- Speak too softly or too loudly

### Accuracy Tips

1. **Account Numbers**: Pause briefly between digits
   - Good: "Zero... one... two... three..."
   - Avoid: "Zeroneotwothree..."

2. **Amounts**: Use clear pronunciation
   - Good: "Five thousand naira"
   - Good: "5000"
   - Avoid: "Fivethousandnaira" (too fast)

3. **Bank Names**: Use full names or common abbreviations
   - Good: "Access Bank"
   - Good: "GTBank"
   - Avoid: "The bank with the red logo"

## Technical Implementation

### Speech Recognition Setup

```typescript
useEffect(() => {
  if (Platform.OS === 'web') {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (event.results[0].isFinal) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        notify.error(`Voice recognition failed: ${event.error}`, 'Error');
      };

      setSpeechRecognition(recognition);
    }
  }
}, []);
```

### Voice State Management

```typescript
const [isRecording, setIsRecording] = useState(false);
const [voiceMode, setVoiceMode] = useState<'off' | 'listening' | 'processing'>('off');
const [speechRecognition, setSpeechRecognition] = useState<any>(null);
const [isAwaitingPin, setIsAwaitingPin] = useState(false);
```

### Conditional Voice Availability

```typescript
// Voice button rendering
<TouchableOpacity
  style={[
    styles.voiceButton,
    voiceMode === 'listening' && styles.voiceButtonListening,
    isAwaitingPin && styles.voiceButtonDisabled,
  ]}
  onPress={toggleVoiceRecording}
  disabled={isAwaitingPin}
>
  <Text>
    {isAwaitingPin ? '🔒' : voiceMode === 'listening' ? '🔴' : '🎤'}
  </Text>
</TouchableOpacity>
```

## Error Handling

### Common Voice Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `not-allowed` | Microphone permission denied | Request permission in browser settings |
| `no-speech` | No audio detected | Speak louder or check microphone |
| `audio-capture` | Microphone not available | Check hardware connection |
| `network` | No internet connection | Check network connectivity |
| `aborted` | User stopped recording | Normal - no action needed |

### Error Messages

```typescript
recognition.onerror = (event: any) => {
  switch(event.error) {
    case 'not-allowed':
      notify.error('Microphone access denied. Please enable it in settings.', 'Error');
      break;
    case 'no-speech':
      notify.info('No speech detected. Please try again.', 'Info');
      break;
    default:
      notify.error(`Voice recognition failed: ${event.error}`, 'Error');
  }
};
```

## Accessibility

### Voice Benefits for Accessibility

- ✅ **Hands-free operation**: No typing required
- ✅ **Visual impairment support**: Speak instead of read
- ✅ **Motor disability support**: No fine motor control needed
- ✅ **Multilingual support**: Works in multiple languages
- ✅ **Speed**: Faster than typing for some users

### Additional Accessibility Features

- Text fallback always available
- Screen reader compatible
- Keyboard navigation support
- High contrast mode support

## Testing

### Voice Transfer Testing Checklist

- [ ] Start voice recording
- [ ] Say "Transfer money"
- [ ] Verify AI responds
- [ ] Say amount: "Five thousand naira"
- [ ] Say account: "Zero one two three four five six seven eight nine"
- [ ] Say bank: "Access Bank"
- [ ] Say "Skip" for description
- [ ] Verify voice button is disabled at PIN step
- [ ] Type PIN: 2348
- [ ] Verify transfer succeeds
- [ ] Say "View receipt"
- [ ] Verify receipt displays

### Edge Cases to Test

- [ ] Noisy environment
- [ ] Soft speech
- [ ] Accented speech
- [ ] Interrupted speech
- [ ] Browser tab in background
- [ ] Low microphone volume
- [ ] Network interruption during recognition

## Future Enhancements

1. **Multi-language Support**
   - Yoruba, Igbo, Hausa voice recognition
   - Auto-detect language

2. **Voice Confirmation**
   - AI reads back details in voice
   - User confirms with "Yes" or "Confirm"

3. **Biometric PIN**
   - Voice biometric authentication
   - Replace PIN with voice signature

4. **Wake Word**
   - "Hey FMFB" to start conversation
   - Hands-free initiation

5. **Offline Mode**
   - Download voice models
   - Work without internet

## Limitations

1. **PIN Security**: Voice disabled for PIN entry
2. **Browser Support**: Not all browsers support speech recognition
3. **Accuracy**: May misinterpret in noisy environments
4. **Language**: Currently English only
5. **Internet Required**: Needs connection for speech processing

## Related Documentation

- [Conversational Transfer Flow](./CONVERSATIONAL_TRANSFER_FLOW.md)
- [PIN Input Security](./AI_CHAT_PIN_AND_RECEIPT_FIXES.md)
- [AI Chat Enhancements](./AI_ASSISTANT_ENHANCEMENTS_SUMMARY.md)
