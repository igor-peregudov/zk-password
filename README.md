# zk-password

Zero-Knowledge password verification SDK using Noir + Poseidon2 hash + Barretenberg.

This SDK allows clients to prove knowledge of a password without revealing it to the backend using zk-SNARKs.

---

## ✨ Features

* zk-SNARK proof of password knowledge.
* Poseidon2 hashing with Barretenberg.
* Fully client-side registration & proof generation.
* Server-side verification of proofs.
* Stateless login: no passwords stored.
* Can be integrated with access/refresh token issuance.
* No need to compile Noir circuits manually — circuit is bundled in the package.

---

## ✨ Installation

```bash
npm install zk-password @aztec/bb.js@0.84.0 @noir-lang/noir_js@1.0.0-beta.6 argon2-browser@1.18.0
```

> 👀 You can find an example Vite config in the example folder.

---

## 📃 Usage & Protocol Flow

### 🔐 Register (Client)

```ts
import { ZkPassword } from 'zk-password';

const zk = await ZkPassword.init();
const password = 'secret_password';
const userTag = 'user@example.com';

const { passwordHash, salt } = await zk.register(password, userTag);

// Send this to backend:
fetch('/api/register', {
  method: 'POST',
  body: JSON.stringify({
    user_tag: userTag,
    password_hash: passwordHash,
    salt,
  }),
});
```

---

### 🔓 Login (Client)

```ts
// First, request salt + nonce from backend
const userTag = 'user@example.com';
const res = await fetch(`/api/login-init?user_tag=${userTag}`);
const { salt, nonce } = await res.json();

const zk = await ZkPassword.init();
const result = await zk.login('secret_password', userTag, salt, nonce);

// Send this to backend for verification:
fetch('/api/login-complete', {
  method: 'POST',
  body: JSON.stringify({
    user_tag: userTag,
    proof: result.proof,
    publicSignals: result.publicSignals,
  }),
});
```

---

### ✅ Verify (Backend)

```ts
import { verifyProof } from 'zk-password';

app.post('/api/login-complete', async (req, res) => {
  const { user_tag, proof, publicSignals } = req.body;

  const isValid = await verifyProof(proof);
  if (!isValid) return res.status(400).json({ error: 'Invalid ZK proof' });

  const user = await db.findUser(user_tag);
  if (!user || user.password_hash !== publicSignals.password_hash) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (await db.isNullifierUsed(publicSignals.nullifier_out)) {
    return res.status(409).json({ error: 'Replay detected' });
  }

  await db.markNullifier(publicSignals.nullifier_out);

  // Issue access/refresh tokens as needed
  const tokens = generateTokens(user.id);
  res.json(tokens);
});
```

---

### Registration (Client Side)

1. User enters `password` and `userTag` (e.g., email or username).
2. Client generates a random `salt` (16 bytes).
3. Derives password hash with Argon2: `preimage = Argon2(password, salt)`
4. Computes:

   * `tagHash = Poseidon(userTag)`
   * `password_hash = Poseidon(preimage, tagHash)`
5. Sends the following JSON to the backend for storage:

```json
{
  "password_hash": "...",
  "salt": "...",
  "user_tag": "..."
}
```

**Backend stores:**

* `user_tag` — acts as identifier.
* `password_hash` — later compared with value in proof.
* `salt` — returned to client during login.

---

### Login Flow

1. Client requests login with `userTag`
2. **Backend responds with:**

```json
{
  "salt": "...",
  "nonce": "..."
}
```

3. Client inputs `password`, reuses `salt`, и получает `nonce`
4. Computes:

   * `preimage = Argon2(password, salt)`
   * `tagHash = Poseidon(userTag)`
   * `password_hash = Poseidon(preimage, tagHash)`
   * `nullifier_out = Poseidon(preimage, nonce, tagHash)`
5. Generates zk-proof using Noir
6. Sends proof + public signals:

```json
{
  "proof": {
    "proof": ["0x...", "0x..."]
  },
  "publicSignals": {
    "password_hash": "...",
    "session_nonce": "...",
    "nullifier_out": "..."
  },
  "user_tag": "..."
}
```

**Backend then:**

1. Verifies zk-proof using `verifyProof(proof)`
2. Validates `password_hash` against stored
3. Checks uniqueness of `nullifier_out`
4. Optionally issues access & refresh tokens

---

## 🔐 Security Analysis

### Rainbow Table & Dictionary Attacks

**Threat:** Attacker could precompute hashes for known passwords (rainbow table).

**Why it fails:**

* `password_hash` is derived from `Argon2(password, salt)` + Poseidon, making precomputation infeasible.
* Salt is random and unique per user.
* Argon2 parameters increase computational cost significantly.

### Server Breach / Credential Leakage

**Threat:** If an attacker gains access to the backend DB and obtains `password_hash` and `salt`.

**Why it fails:**

* `password_hash` alone is not sufficient to log in.
* Proof requires the actual password to compute the witness (`preimage`).
* zk-proof cannot be faked without correct input.

### Replay Attacks

**Threat:** Reusing an old valid proof to re-authenticate.

**Why it fails:**

* Each login session uses a unique `nonce` (timestamp or UUID).
* `nullifier_out` binds proof to that session.
* Backend must track `nullifier_out` to detect reuse.

### Forged Proofs

**Threat:** Generating a valid proof without knowing the password.

**Why it fails:**

* Proof generation requires the witness: derived password preimage.
* Circuit enforces correctness via constraints.
* `UltraHonkBackend` guarantees zk soundness and security.

---

## ▶️ Running the Example

To test the SDK in a real browser environment:

```bash
cd example
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) to interact with the form.

---

## License

Apache License 2.0

```
Copyright 2025 Igor Peregudov

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
