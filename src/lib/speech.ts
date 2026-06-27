// Web Speech API wrapper for transcription

export interface SpeechRecognitionHelperOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd: () => void;
  onError: (error: string) => void;
  lang?: string;
}

export class SpeechRecognitionHelper {
  private recognition: any = null;
  private isListening = false;
  private options: SpeechRecognitionHelperOptions;

  constructor(options: SpeechRecognitionHelperOptions) {
    this.options = options;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = options.lang || 'en-US';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // We call the callback with the accumulated transcript
      const currentTranscript = finalTranscript || interimTranscript;
      const isFinal = finalTranscript.length > 0;
      this.options.onResult(currentTranscript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      this.options.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onEnd();
    };
  }

  public static isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public start() {
    if (!this.recognition) {
      this.options.onError('Speech recognition not supported in this browser.');
      return;
    }
    if (this.isListening) return;

    try {
      this.isListening = true;
      this.recognition.start();
    } catch (err: any) {
      this.isListening = false;
      this.options.onError(err.message || 'Failed to start recording.');
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
  }
}
