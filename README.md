<img src="./Eclypses.png" style="width:50%;margin-right:0;"/>

<div align="center" style="font-size:40pt; font-weight:900; font-family:arial; margin-top:300px;">
Angular HTTP Tutorial</div>

<div align="center" style="font-size:15pt; font-family:arial; " >
Using MTE version 3.1.x</div>

# Introduction

This tutorial shows you how to implement the MTE into an existing HTTP connection. This is only one example, the MTE does NOT require the usage of HTTP, you can use whatever communication protocol that is needed.

This tutorial demonstrates how to use MTE Core, MTE MKE and MTE Fixed Length. Depending on what your needs are, these three different implementations can be used in the same application OR you can use any one of them. They are not dependent on each other and can run simultaneously in the same application if needed.

The SDK that you received from Eclypses may not include the MKE or MTE FLEN add-ons. If your SDK contains either the MKE or the Fixed Length add-ons, the name of the SDK will contain "-MKE" or "-FLEN". If these add-ons are not there and you need them please work with your sales associate. If there is no need, please just ignore the MKE and FLEN options.

Here is a short explanation of when to use each, but it is encouraged to either speak to a sales associate or read the dev guide if you have additional concerns or questions.

**_MTE Core:_** This is the recommended version of the MTE to use. Unless payloads are large or sequencing is needed this is the recommended version of the MTE and the most secure.

**_MTE MKE:_** This version of the MTE is recommended when payloads are very large, the MTE Core would, depending on the token byte size, be multiple times larger than the original payload. Because this uses the MTE technology on encryption keys and encrypts the payload, the payload is only enlarged minimally.

**_MTE Fixed Length:_** This version of the MTE is very secure and is used when the resulting payload is desired to be the same size for every transmission. The Fixed Length add-on is mainly used when using the sequencing verifier with MTE. In order to skip dropped packets or handle asynchronous packets the sequencing verifier requires that all packets be a predictable size. If you do not wish to handle this with your application then the Fixed Length add-on is a great choice. This is ONLY an Encoder change - the Decoder that is used is the MTE Core Decoder.

In this tutorial we are creating an MTE Encoder and a MTE Decoder on a client that exists in the browser. This is only needed when there are messages being sent from both sides. If only one side of your application is sending messages, then the side that sends the messages should have an MTE Encoder and the side receiving the messages needs only an MTE Decoder. You will need to pair this tutorial with a server in order for the HTTP requests to communicate.

**IMPORTANT:**

**NOTE:** _The solution provided in this tutorial does NOT include the MTE library or any supporting MTE library files. If you have NOT been provided a MTE library and supporting files, please contact Eclypses Inc. The solution will only work AFTER the MTE library and any required MTE library files have been included._

**NOTE:** _This tutorial is provided in TypeScript. If you are not using TypeScript and instead using JavaScript, simply ignore the additional TypeScript syntax in the instructions. You will receive the same result._

# Tutorial Overview

The structure of this lab tutorial is as follows:

```bash
.
├── start
└── finish
```

| Directory | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| `finish`  | Example of project after completing the tutorial to reference             |
| `start`   | Project where you can follow along with the tutorial to implement the MTE |

_There is only a client version of this tutorial. It is recommended to follow an additional Eclypses tutorial with a different language/framework that supports a server using the HTTP communication protocol in order to successfully pair them together._

# MTE Implementation

1. **Add MTE to your project**

   - Locate the TypeScript or JavaScript MTE compressed directory that was provided to you
   - Add the `Mte.ts` file into your project solution

2. **Import the following from `Mte.ts` in your `app.component.ts` file**

   ```typescript
   import {
     MteDec, // Only if you are using MTE Core
     MteEnc, // Only if you are using MTE Core
     MteStatus,
     MteBase,
     MteWasm,
     MteMkeDec, // Only if you are using MKE
     MteMkeEnc, // Only if you are using MKE
     MteFlenEnc, // Only if you are using MTE FLEN
   } from "./Mte";
   ```

3. **Add default state for the following MTE properties that we will need to globally access inside of our component.**

```typescript
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
encoderEntropy = '';
decoderEntropy = '';
encoderNonce = '1';
decoderNonce = '0';
identifier = 'demo';
```

We also need to change the type and default value for the `outgoingEncodedMessage` and `decodedMessage` since we will be using the MTE

```typescript
outgoingEncodedMessage: MteStrStatus = {
  str: "",
  status: MteStatus.mte_status_success,
};
decodedMessage: MteStrStatus = {
  str: "",
  status: MteStatus.mte_status_success,
};
```

4. **Create an async function to instantiate the `MteWasm` and `MteBase`.**

   - `MteWasm` should only be instantiated once in your application.
   - This method returns a promise, so make sure you `await` it in an async function.
   - `MteBase` gives us access to MTE helper methods.
     - You must pass an instantiated `MteWasm` into `MteBase`.

```typescript
   async instantiateMte() {
     this.wasm = new MteWasm();
     await this.wasm.instantiate();
     this.base = new MteBase(this.wasm);
   }
```

6. **To ensure the MTE library is licensed correctly run the license check**

   - The `licenseCompanyName`, and `licenseKey` below should be replaced with your company’s MTE license information provided by Eclypses. If a trial version of the MTE is being used, any value can be passed into those fields for it to work.

   ```typescript
   runMteTests() {
     if (this.base) {
       const licenseCompany = 'Eclypses Inc.';
       const licenseKey = 'Eclypses123';

       // Check MTE license
       // Initialize MTE license. If a license code is not required (e.g., trial mode), this can be skipped.
       if (!this.base.initLicense(licenseCompany, licenseKey)) {
         const licenseStatus = MteStatus.mte_status_license_error;

         console.error(
           `License error (${this.base.getStatusName(
             licenseStatus,
           )}): ${this.base.getStatusDescription(licenseStatus)}`,
         );
       }
     }
   }
   ```

7. **Create MTE Decoder Instance and MTE Encoder Instances.**

   - Each Encoder and Decoder require three values. These values should be treated like encryption keys and never exposed. For demonstration purposes in this tutorial we are simply allowing default values of 0 to be set. In a production environment these values should be protected and not available to outside sources. For the entropy, we have to determine the size of the allowed entropy value based on the drbg we have selected.

     - Entropy
       - To set the entropy in the tutorial we are getting the minimum bytes required and creating a string of that length that contains all zeros.
       - You will need an instance of the Encoder or Decoder to get the correct entropy based on the DRBG that they are using with the helper method `getDrbg()`
     - Nonce
       - We are adding 1 to the Encoder nonce so that the return value changes. This is optional, the same nonce can be used for the Encoder and Decoder. Server side values will be switched so they match up to the Encoder/Decoder and vice versa.
     - Identifier

   Here is a sample that creates the MTE Decoder.

   ```typescript
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
      mteDecoder.getDrbg(),
    );
    this.decoderEntropy =
      entropyMinBytes > 0 ? '0'.repeat(entropyMinBytes) : this.decoderEntropy;

    // Set entropy and nonce for the Encoder
    mteDecoder.setEntropyStr(this.decoderEntropy);
    mteDecoder.setNonce(this.decoderNonce);

    // Initialize MTE Encoder with identifier
    this.decoderStatus = mteDecoder.instantiate(this.identifier);

    if (this.base.statusIsError(this.decoderStatus)) {
      console.error(
        `Failed to initialize the MTE Encoder engine.  Status: ${this.base.getStatusName(
          this.decoderStatus,
        )} / ${this.base.getStatusDescription(this.decoderStatus)}`,
      );
    } else {
      this.decoder = mteDecoder;
    }
   }
   }
   ```

- (For further info on Decoder constructor – Check out the Developers Guide)\*

  Here is a sample function that creates the MTE Encoder.

  ```typescript
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
     mteEncoder.getDrbg(),
   );
   this.encoderEntropy =
     entropyMinBytes > 0 ? '0'.repeat(entropyMinBytes) : this.encoderEntropy;

   // Set entropy and nonce for the Encoder
   mteEncoder.setEntropyStr(this.encoderEntropy);
   mteEncoder.setNonce(this.encoderNonce);

   // Initialize MTE Encoder with identifier
   this.encoderStatus = mteEncoder.instantiate(this.identifier);

   if (this.base.statusIsError(this.encoderStatus)) {
     console.error(
       `Failed to initialize the MTE Encoder engine.  Status: ${this.base.getStatusName(
         this.encoderStatus,
       )} / ${this.base.getStatusDescription(this.encoderStatus)}`,
     );
   } else {
     this.encoder = mteEncoder;
   }
  }
  }
  ```

  - (For further info on Encode constructor – Check out the Developers Guide)\*

8. **Next, we need to add the MTE calls to encode and decode the messages that we are sending and receiving inside of the `onSubmit()` method.**

- Ensure the Encoder is called to encode the outgoing text, then the Decoder is called to decode the incoming response.
- Please check out the Developers Guide for further information on the various encoding and decoding methods. In this tutorial, we are using a method that takes a string and encodes to a string. The Decoder is taking a byte array and decoding to a string.

Here is a sample of how to do this for the Encoder

```typescript
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
```

Here is a sample of how to do this for the Decoder

```typescript
if (this.decoder && this.base) {
  this.decodedMessage = this.decoder?.decodeStr(byteArray);

  if (this.base.statusIsError(this.decodedMessage.status)) {
    console.log(
      `Error decoding: Status: ${this.base.getStatusName(
        this.decodedMessage.status
      )} / ${this.base.getStatusDescription(this.decodedMessage.status)}`
    );
  }
}
```

9. **Lastly, we need to use the `async` verions Angular's `ngOnInit()` lifecycle hook to trigger our methods in the correct order and at the start of the application.**

   - First, we `await` and instantiate the MTE on initial render

   - Second, we setup the MTE options

   - Third, we run the MTE tests

   - Fourth, we create the Encoder and the Decoder

     ```typescript
     async ngOnInit() {
       await this.instantiateMte();
       this.runMteTests();
       this.createEncoder();
       this.createDecoder();
     }
     ```

10. **We need to modify the `app.component.html` file to designate our `[(ngModel)]` attributes to the correct values**

    - Since we changed `outgoingEncodedMessage` and `decodedMessage` from `string` to `MteStrStatus`, those input elements need their `[(ngModel)]` attributes to be assigned to the object's `str` property

      ```html
      <input
        type="text"
        class="form-control"
        name="outgoingEncodedMessage.str"
        [(ngModel)]="outgoingEncodedMessage.str"
        disabled
      />
      ```

      ```html
      <input
        type="text"
        class="form-control"
        name="decodedMessage.str"
        [(ngModel)]="decodedMessage.str"
        disabled
      />
      ```

**_The Client side of the MTE HTTP Angular Tutorial should now be ready for use on your device._**

<div style="page-break-after: always; break-after: page;"></div>

# Contact Eclypses

<img src="Eclypses.png" style="width:8in;"/>

<p align="center" style="font-weight: bold; font-size: 22pt;">For more information, please contact:</p>
<p align="center" style="font-weight: bold; font-size: 22pt;"><a href="mailto:info@eclypses.com">info@eclypses.com</a></p>
<p align="center" style="font-weight: bold; font-size: 22pt;"><a href="https://www.eclypses.com">www.eclypses.com</a></p>
<p align="center" style="font-weight: bold; font-size: 22pt;">+1.719.323.6680</p>

<p style="font-size: 8pt; margin-bottom: 0; margin: 300px 24px 30px 24px; " >
<b>All trademarks of Eclypses Inc.</b> may not be used without Eclypses Inc.'s prior written consent. No license for any use thereof has been granted without express written consent. Any unauthorized use thereof may violate copyright laws, trademark laws, privacy and publicity laws and communications regulations and statutes. The names, images and likeness of the Eclypses logo, along with all representations thereof, are valuable intellectual property assets of Eclypses, Inc. Accordingly, no party or parties, without the prior written consent of Eclypses, Inc., (which may be withheld in Eclypses' sole discretion), use or permit the use of any of the Eclypses trademarked names or logos of Eclypses, Inc. for any purpose other than as part of the address for the Premises, or use or permit the use of, for any purpose whatsoever, any image or rendering of, or any design based on, the exterior appearance or profile of the Eclypses trademarks and or logo(s).
</p>
