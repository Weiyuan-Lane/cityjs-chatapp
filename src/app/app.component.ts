import { ChangeDetectorRef, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageInputComponent } from './message-input/message-input.component';
import { MessagesComponent } from './messages/messages.component';
import { Message, MessageMetadata } from '../types/message';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatProgressSpinnerModule,
    CommonModule,
    MessagesComponent,
    MessageInputComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'chat-with-gemini';

  @ViewChild('scroll', { read: ElementRef })
  public scroll!: ElementRef<any>;

  public messages: Message[] = [];
  public loaderStatus: boolean = false;
  public useStreaming: boolean = false; // Toggle for streaming mode

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  public scrollBottom() {
    this.scroll.nativeElement.scrollTop = this.scroll.nativeElement.scrollHeight;
  }

  public sendMessage(messageText: string) {
    this.messages.push({
      content: messageText,
      timestamp: new Date(),
      self: true
    });
    setTimeout(() => {
      this.scrollBottom();
    });

    if (this.useStreaming) {
      this.sendMessageStreaming(messageText);
    } else {
      this.sendMessageNonStreaming(messageText);
    }
  }

  private sendMessageNonStreaming(messageText: string) {
    this.loaderStatus = true;
    return this.http
      .post<{ message: string; metadata?: MessageMetadata }>('/chat', {
        message: messageText,
      })
      .subscribe((data) => {
        this.loaderStatus = false;
        this.messages.push({
          content: data.message,
          timestamp: new Date(),
          self: false,
          metadata: data.metadata,
        });
        this.cdr.detectChanges();
        setTimeout(() => {
          this.scrollBottom();
        });
      });
  }

  private sendMessageStreaming(messageText: string) {
    this.loaderStatus = true;

    // Create a new message placeholder for streaming content
    const streamingMessage: Message = {
      content: '',
      timestamp: new Date(),
      self: false,
      metadata: undefined
    };
    this.messages.push(streamingMessage);
    const messageIndex = this.messages.length - 1;

    // Use fetch with ReadableStream for SSE with POST
    fetch('/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageText }),
    })
      .then(response => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = (): Promise<void> => {
          if (!reader) return Promise.resolve();

          return reader.read().then(({ done, value }) => {
            if (done) {
              this.ngZone.run(() => {
                this.loaderStatus = false;
                this.cdr.detectChanges();
              });
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            lines.forEach(line => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  this.ngZone.run(() => {
                    this.handleStreamChunk(data, messageIndex);
                  });
                } catch (e) {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            });

            return processStream();
          });
        };

        return processStream();
      })
      .catch(error => {
        console.error('Streaming error:', error);
        this.ngZone.run(() => {
          this.loaderStatus = false;
          this.messages[messageIndex].content = 'Error: Failed to get response';
          this.cdr.detectChanges();
        });
      });
  }

  private handleStreamChunk(data: { type: string; content: any }, messageIndex: number) {
    switch (data.type) {
      case 'text':
        // Append raw text for real-time streaming display
        this.messages[messageIndex].content += data.content;
        // Hide loader as soon as first content arrives
        this.loaderStatus = false;
        break;
      case 'grounding':
        // Set grounding metadata
        this.messages[messageIndex].metadata = { grounding: data.content };
        break;
      case 'done':
        // Replace with final parsed markdown content
        this.messages[messageIndex].content = data.content;
        this.loaderStatus = false;
        break;
      case 'error':
        this.messages[messageIndex].content = `Error: ${data.content}`;
        this.loaderStatus = false;
        break;
    }
    this.cdr.detectChanges();
    setTimeout(() => {
      this.scrollBottom();
    });
  }
}
