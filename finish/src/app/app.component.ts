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
/* Step 2 */
import {
  MteBase,
  MteWasm,
  MteDec,
  MteEnc,
  MteStatus,
  MteStrStatus,
  MteMkeDec,
  MteMkeEnc,
  MteFlenEnc,
} from "./Mte";
import { fromByteArray } from "base64-js";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  // This tutorial uses HTTP for communication.
  // It should be noted that the MTE can be used with any type of communication. (HTTP is not required!)

  /* Step 3 */
  // Add default state for MTE properties that we need global access to
  wasm?: MteWasm;
  base?: MteBase;

  //---------------------------------------------------
  // Comment out to use MKE or MTE FLEN instead of MTE Core
  //---------------------------------------------------
  decoder?: MteDec;
  encoder?: MteEnc;

  //---------------------------------------------------
  // Uncomment to use MKE instead of MTE Core
  //---------------------------------------------------
  // encoder?: MteMkeEnc;
  // decoder?: MteMkeDec;

  //---------------------------------------------------
  // Uncomment to use MTE FLEN instead of MTE Core
  //---------------------------------------------------
  // fixedLength = 8;
  // encoder?: MteFlenEnc;
  // decoder?: MteDec;

  encoderStatus = MteStatus.mte_status_success;
  decoderStatus = MteStatus.mte_status_success;
  encoderEntropy = "";
  decoderEntropy = "";
  encoderNonce = "1";
  decoderNonce = "0";
  identifier = "demo";
  message = "";

  outgoingEncodedMessage: MteStrStatus = {
    str: "",
    status: MteStatus.mte_status_success,
  };
  incomingEncodedMessage = "";
  decodedMessage: MteStrStatus = {
    str: "",
    status: MteStatus.mte_status_success,
  };
  ip = "";
  port = "";

  constructor(private messageService: MessageService) {}

  /* Step 4 */
  // Instantiate MteWasm and MteBase
  async instantiateMte() {
    this.wasm = new MteWasm();
    await this.wasm.instantiate();
    this.base = new MteBase(this.wasm);
  }

  /* Step 5 */
  // Run MTE tests
  runMteTests() {
    if (this.base) {
      const licenseCompany = "Eclypses Inc.";
      const licenseKey = "Eclypses123";

      // Check MTE license
      // Initialize MTE license. If a license code is not required (e.g., trial mode), this can be skipped.
      if (!this.base.initLicense(licenseCompany, licenseKey)) {
        const licenseStatus = MteStatus.mte_status_license_error;

        console.error(
          `License error (${this.base.getStatusName(
            licenseStatus
          )}): ${this.base.getStatusDescription(licenseStatus)}`
        );
      }
    }
  }

  /* Step 6 */
  // Create Encoder
  createEncoder() {
    if (this.wasm && this.base) {
      //---------------------------------------------------
      // Comment out to use MKE or MTE FLEN instead of MTE Core
      //---------------------------------------------------
      const mteEncoder = MteEnc.fromdefault(this.wasm);

      //---------------------------------------------------
      // Uncomment to use MKE instead of MTE Core
      //---------------------------------------------------
      // const mteEncoder = MteMkeEnc.fromdefault(this.wasm);

      //---------------------------------------------------
      // Uncomment to use MTE FLEN instead of MTE Core
      //---------------------------------------------------
      // const mteEncoder = MteFlenEnc.fromdefault(this.wasm, this.fixedLength);

      // Check how long entropy we need, set default, and prompt if we need it
      const entropyMinBytes = this.base.getDrbgsEntropyMinBytes(
        mteEncoder.getDrbg()
      );
      this.encoderEntropy =
        entropyMinBytes > 0 ? "0".repeat(entropyMinBytes) : this.encoderEntropy;

      // Set entropy and nonce for the Encoder
      mteEncoder.setEntropyStr(this.encoderEntropy);
      mteEncoder.setNonce(this.encoderNonce);

      // Initialize MTE Encoder with identifier
      this.encoderStatus = mteEncoder.instantiate(this.identifier);

      if (this.base.statusIsError(this.encoderStatus)) {
        console.error(
          `Failed to initialize the MTE Encoder engine.  Status: ${this.base.getStatusName(
            this.encoderStatus
          )} / ${this.base.getStatusDescription(this.encoderStatus)}`
        );
      } else {
        this.encoder = mteEncoder;
      }
    }
  }

  /* Step 6 CONTINUED */
  // Create Decoder
  createDecoder() {
    if (this.wasm && this.base) {
      //---------------------------------------------------
      // Comment out to use MKE instead of MTE Core
      //---------------------------------------------------
      const mteDecoder = MteDec.fromdefault(this.wasm);

      //---------------------------------------------------
      // Uncomment to use MKE instead of MTE Core
      //---------------------------------------------------
      // const mteDecoder = MteMkeDec.fromdefault(this.wasm);

      // Check how long entropy we need, set default, and prompt if we need it
      const entropyMinBytes = this.base.getDrbgsEntropyMinBytes(
        mteDecoder.getDrbg()
      );
      this.decoderEntropy =
        entropyMinBytes > 0 ? "0".repeat(entropyMinBytes) : this.decoderEntropy;

      // Set entropy and nonce for the Decoder
      mteDecoder.setEntropyStr(this.decoderEntropy);
      mteDecoder.setNonce(this.decoderNonce);

      // Initialize MTE Decoder with identifier
      this.decoderStatus = mteDecoder.instantiate(this.identifier);

      if (this.base.statusIsError(this.decoderStatus)) {
        console.error(
          `Failed to initialize the MTE Decoder engine.  Status: ${this.base.getStatusName(
            this.decoderStatus
          )} / ${this.base.getStatusDescription(this.decoderStatus)}`
        );
      } else {
        this.decoder = mteDecoder;
      }
    }
  }

  /* Step 7 */
  // Run above methods at beginning of application lifecycle
  async ngOnInit() {
    try {
      await this.instantiateMte();
      this.runMteTests();
      this.createEncoder();
      this.createDecoder();
    } catch (error) {
      console.error("Something went wrong setting up the MTE", error);
    }
  }

  onSubmit() {
    /* Step 8 */
    // Encode text to send and ensuring successful
    if (this.encoder && this.base) {
      this.outgoingEncodedMessage = this.encoder.encodeStrB64(this.message);

      if (this.base.statusIsError(this.outgoingEncodedMessage.status)) {
        console.error(
          `Error encoding: Status: ${this.base.getStatusName(
            this.outgoingEncodedMessage.status
          )} / ${this.base.getStatusDescription(
            this.outgoingEncodedMessage.status
          )}`
        );
      }
    }

    // Send message over HTTP and receive response
    if (this.outgoingEncodedMessage.str) {
      this.messageService
        .postMessage(this.outgoingEncodedMessage.str, this.ip, this.port)
        .subscribe((buffer) => {
          // Grab byte array out of response
          const byteArray = new Uint8Array(buffer);
          this.incomingEncodedMessage = fromByteArray(byteArray);

          /* Step 8 CONTINUED... */
          // Decode incoming message and check for successful response
          if (this.decoder && this.base) {
            this.decodedMessage = this.decoder?.decodeStr(byteArray);

            if (this.base.statusIsError(this.decodedMessage.status)) {
              console.log(
                `Error decoding: Status: ${this.base.getStatusName(
                  this.decodedMessage.status
                )} / ${this.base.getStatusDescription(
                  this.decodedMessage.status
                )}`
              );
            }
          }
        });
    }

    this.message = "";
  }
}
