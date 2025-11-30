// AudioWorklet Processor for capturing microphone audio
// This runs on a dedicated audio thread for low-latency processing

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Smaller buffer for lower latency
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.isRecording = true;
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.command === 'stop') {
        this.isRecording = false;
      } else if (event.data.command === 'start') {
        this.isRecording = true;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0] || !this.isRecording) {
      return true;
    }

    const inputChannel = input[0];
    
    // Copy input samples to buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];
      
      // When buffer is full, send it to main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Check for silence (noise gate)
        let maxAmplitude = 0;
        for (let j = 0; j < this.buffer.length; j++) {
          const abs = Math.abs(this.buffer[j]);
          if (abs > maxAmplitude) maxAmplitude = abs;
        }
        
        // Only send if there's actual audio (not just noise)
        if (maxAmplitude > 0.01) {
          // Send a copy of the buffer
          this.port.postMessage({
            type: 'audio',
            buffer: this.buffer.slice()
          });
        }
        
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);

