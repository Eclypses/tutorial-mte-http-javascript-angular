/*
THIS SOFTWARE MAY NOT BE USED FOR PRODUCTION. Otherwise,
The MIT License (MIT)

Copyright (c) Eclypses, Inc.

All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { Component } from "@angular/core";
import { MessageService } from "./services/message.service";
import { fromByteArray } from "base64-js";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  // This tutorial uses HTTP for communication.
  // It should be noted that the MTE can be used with any type of communication. (HTTP is not required!)

  // Here is where you would want to gather settings for the MTE to be saved as state
  message = "";
  outgoingEncodedMessage = "";
  incomingEncodedMessage = "";
  decodedMessage = "";
  ip = "";
  port = "";

  constructor(private messageService: MessageService) {}

  // Here is where you would run the below methods through an Angular lifecycle hook

  // Here is where you would create a method to instantiate the MteWasm and MteBase

  // Here is where you would create a method to setup Mte Options

  // Here is where you would create a method to run Mte Tests

  // Here is where you would create a method to create the encoder and decoder

  onSubmit() {
    // MTE Encoding the text would go here prior to sending over HTTP
    this.outgoingEncodedMessage = this.message;

    if (!this.ip) this.ip = "localhost";
    if (!this.port) this.port = "27015";

    // Send message over HTTP and receive response
    this.messageService
      .postMessage(this.outgoingEncodedMessage)
      .subscribe((buffer) => {
        // Grab byte array out of response
        const byteArray = new Uint8Array(buffer);
        this.incomingEncodedMessage = fromByteArray(byteArray);

        // MTE Decoding the bytes would go here instead of using the Node TextDecoder
        this.decodedMessage = new TextDecoder().decode(byteArray);
      });

    this.message = "";
  }
}
