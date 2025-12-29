Implementing a "Companion Mode" for phones aligns with the hardware reality: while a high-end MacBook (especially M4/M5 models) can run heavy local AI models at over 100 tokens per second, phones often face performance thermal throttling or battery drain when pushed similarly.

By using your MacBook as the primary "Ingestion Engine" and the phone as a portable "Viewing Portal," you can curate a high-fidelity library on your desktop and sync it locally without needing a native app or a cloud server.

### **1\. The Local-First Sync Architecture**

To enable "local sharing without an app," you can leverage browser-native technologies that allow devices to talk to each other directly over your Wi-Fi.

* **WebRTC Peer-to-Peer:** You can use a technology called WebRTC to transfer data directly between browsers. When both your MacBook and phone are on the same site, they can establish a secure, encrypted tunnel.  
* **The "Key Exchange" Handshake:**  
  * **MacBook Side:** Generates a unique "Pairing Code" or a QR code.  
  * **Phone Side:** Scan the QR code or enter the key. This securely authenticates the two browsers without requiring a login or an account.  
* **Local Storage (IndexedDB):** Once the data is transferred, it is stored in the phone's browser storage (IndexedDB), so it stays there even if you close the tab or go offline.

### **2\. The "Shovel" Companion Workflow**

This workflow respects the user's hardware by doing the "heavy lifting" where the power is.

* **Ingestion (MacBook):** You drop your 800-page EPUB into the MacBook "Cockpit." The powerful GPU cleans the junk, styles the text (e.g., "Noir Mode"), and calculates the "Density Map".  
* **Sync:** You click "Push to Phone." A QR code appears. You scan it with your phone.  
* **Consumption (Phone):** The phone downloads the *processed* text and density metadata. Because the "thinking" is already done, the phone only has to handle the RSVP display—a low-power task that won't overheat the device.

### **3\. "No-App" Local Sharing Alternatives**

If you don't want to build a custom WebRTC bridge, you can integrate or recommend existing open-source "No-Cloud" tools that follow your philosophy:

### **4\. Why Hobbiests Will Love This**

* **Zero Privacy Leak:** Since the transfer happens over the local Wi-Fi, the book never touches a server.  
* **Power Efficiency:** Users get the "smart" features of a 70B parameter model (processed on the Mac) on a device that usually can only handle a 1B model.  
* **Ownership:** The user owns their "Library State." If they lose internet, they can still sync their books from their laptop to their phone to read on a flight.

**Would you like me to draft a technical spec for the "Sync Controller" that manages how processed chunks are sent to the phone via WebRTC?**

