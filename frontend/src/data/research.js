export const CATEGORIES = ["AI systems", "Quantum computing", "Optimization", "Cryptography", "Decentralized systems"];

export const KIND = {
  fact: { label: "Established", cls: "text-lab-ok border-lab-ok/30" },
  hypothesis: { label: "Hypothesis", cls: "text-amber-200 border-amber-300/30" },
  experimental: { label: "Experimental idea", cls: "text-[#b9adff] border-lab-violet/40" },
  open: { label: "Open question", cls: "text-white/60 border-white/20" },
};

export const ARTICLES = [
  {
    slug: "ai-systems",
    title: "How modern AI systems work",
    category: "AI systems",
    minutes: 6,
    summary: "Transformers, next-token prediction, tool use and why an assistant can be fluent and still wrong.",
    sections: [
      { heading: "The transformer architecture", kind: "fact", body: [
        "Most current large language models are based on the transformer architecture introduced in 2017. Transformers use self-attention to weigh how relevant every token in a sequence is to every other token, which allows training to be parallelised across large datasets.",
        "A language model is trained to predict the next token given previous tokens. Capabilities such as summarisation or code generation emerge from this objective combined with scale and later fine-tuning.",
      ] },
      { heading: "Fluency is not verification", kind: "fact", body: [
        "Because models generate statistically plausible text, they can produce confident statements that are incorrect (often called hallucinations). Outputs should be checked against primary sources, especially for numbers, citations and code that will be executed.",
      ] },
      { heading: "Agents and tool use", kind: "experimental", body: [
        "Agent workflows interleave model reasoning with external actions such as search, code execution or API calls. Patterns like ReAct show that combining reasoning traces with actions can improve some tasks, but reliability, cost control and safety boundaries remain active engineering problems.",
        "In this lab, the Assistant is a conversational model only: it does not execute transactions, browse the web or access your wallet.",
      ] },
    ],
    sources: [
      { label: "Vaswani et al. (2017), Attention Is All You Need — arXiv:1706.03762", url: "https://arxiv.org/abs/1706.03762" },
      { label: "Yao et al. (2022), ReAct: Synergizing Reasoning and Acting in Language Models — arXiv:2210.03629", url: "https://arxiv.org/abs/2210.03629" },
    ],
  },
  {
    slug: "quantum-inspired-optimization",
    title: "Quantum-inspired optimization on classical hardware",
    category: "Optimization",
    minutes: 7,
    summary: "Simulated annealing, simulated quantum annealing and what “quantum-inspired” honestly means.",
    sections: [
      { heading: "Combinatorial optimization", kind: "fact", body: [
        "Many practical problems — scheduling, routing, portfolio selection, graph partitioning — can be written as finding the lowest-energy configuration of binary variables. Max-Cut is a canonical example and is NP-hard in general, so exact methods scale exponentially.",
        "Goemans and Williamson showed a polynomial-time approximation for Max-Cut with a guaranteed ratio of about 0.878 using semidefinite programming.",
      ] },
      { heading: "Simulated annealing", kind: "fact", body: [
        "Simulated annealing (Kirkpatrick, Gelatt and Vecchi, 1983) explores solutions by random moves, accepting worse moves with a probability that shrinks as a temperature parameter is lowered. It is a classical heuristic with no general optimality guarantee within finite time.",
      ] },
      { heading: "Quantum annealing and its classical simulation", kind: "fact", body: [
        "Quantum annealing (Kadowaki and Nishimori, 1998) replaces thermal fluctuations with a transverse field that is gradually reduced. On classical computers its behaviour can be approximated with path-integral Monte Carlo, often called simulated quantum annealing (SQA), which couples several replicas (Trotter slices) of the system.",
        "SQA is a classical algorithm. The Quantum Field utility in this lab runs SQA in your browser on ordinary hardware.",
      ] },
      { heading: "Does quantum inspiration help?", kind: "open", body: [
        "On some instances SQA finds good solutions with different dynamics from thermal annealing; on others it performs similarly or worse for the same compute budget. There is no general claim that quantum-inspired heuristics outperform well-tuned classical ones, and results depend strongly on instance structure and parameters.",
      ] },
    ],
    sources: [
      { label: "Kirkpatrick, Gelatt & Vecchi (1983), Optimization by Simulated Annealing, Science 220 — doi:10.1126/science.220.4598.671", url: "https://doi.org/10.1126/science.220.4598.671" },
      { label: "Kadowaki & Nishimori (1998), Quantum annealing in the transverse Ising model — arXiv:cond-mat/9804280", url: "https://arxiv.org/abs/cond-mat/9804280" },
      { label: "Goemans & Williamson (1995), Improved approximation algorithms for maximum cut — doi:10.1145/227683.227684", url: "https://doi.org/10.1145/227683.227684" },
      { label: "Tang (2018), A quantum-inspired classical algorithm for recommendation systems — arXiv:1807.04271", url: "https://arxiv.org/abs/1807.04271" },
    ],
  },
  {
    slug: "classical-vs-quantum",
    title: "Classical versus quantum computing",
    category: "Quantum computing",
    minutes: 6,
    summary: "Qubits, known speedups, the NISQ era, and claims to treat with care.",
    sections: [
      { heading: "Bits and qubits", kind: "fact", body: [
        "A classical bit is 0 or 1. A qubit is described by a superposition of basis states, and multiple qubits can be entangled. Measurement yields classical outcomes probabilistically; algorithms must use interference to make useful answers likely.",
      ] },
      { heading: "Known algorithmic speedups", kind: "fact", body: [
        "Shor's algorithm factors integers in polynomial time on a fault-tolerant quantum computer, which would break RSA and elliptic-curve cryptography at sufficient scale. Grover's algorithm gives a quadratic speedup for unstructured search.",
      ] },
      { heading: "The NISQ era", kind: "fact", body: [
        "Current devices are noisy and of intermediate scale (NISQ). Error rates and qubit counts limit circuit depth, and large-scale fault-tolerant machines capable of running Shor's algorithm against real cryptographic keys do not yet exist.",
      ] },
      { heading: "Variational algorithms", kind: "open", body: [
        "Algorithms such as QAOA are proposed for optimization on near-term hardware. Whether they provide practical advantage over the best classical methods for real problems is unresolved.",
      ] },
    ],
    sources: [
      { label: "Shor (1995), Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms — arXiv:quant-ph/9508027", url: "https://arxiv.org/abs/quant-ph/9508027" },
      { label: "Grover (1996), A fast quantum mechanical algorithm for database search — arXiv:quant-ph/9605043", url: "https://arxiv.org/abs/quant-ph/9605043" },
      { label: "Preskill (2018), Quantum Computing in the NISQ era and beyond — arXiv:1801.00862", url: "https://arxiv.org/abs/1801.00862" },
      { label: "Farhi, Goldstone & Gutmann (2014), A Quantum Approximate Optimization Algorithm — arXiv:1411.4028", url: "https://arxiv.org/abs/1411.4028" },
    ],
  },
  {
    slug: "verifiable-computation",
    title: "Verifiable computation",
    category: "Cryptography",
    minutes: 5,
    summary: "Proving that a computation was performed correctly without redoing it.",
    sections: [
      { heading: "Interactive and zero-knowledge proofs", kind: "fact", body: [
        "Interactive proof systems let a verifier become convinced a statement is true by exchanging messages with a prover. Zero-knowledge proofs additionally reveal nothing beyond the statement's validity. These ideas were formalised by Goldwasser, Micali and Rackoff.",
      ] },
      { heading: "Succinct proofs in practice", kind: "fact", body: [
        "Modern proof systems (SNARKs and STARKs) produce short proofs that are cheap to verify. Ethereum zk-rollups use them to post validity proofs for batches of transactions to Layer 1.",
      ] },
      { heading: "Verifiable records for experiments", kind: "experimental", body: [
        "A simpler, near-term idea for this lab is to publish hash commitments of benchmark inputs, parameters and outputs so that results can be reproduced and checked later. This is a research direction, not an implemented feature.",
      ] },
    ],
    sources: [
      { label: "Goldwasser, Micali & Rackoff (1989), The Knowledge Complexity of Interactive Proof Systems, SIAM J. Comput. — doi:10.1137/0218012", url: "https://doi.org/10.1137/0218012" },
      { label: "ethereum.org — Zero-knowledge rollups", url: "https://ethereum.org/en/developers/docs/scaling/zk-rollups/" },
    ],
  },
  {
    slug: "decentralized-infrastructure",
    title: "Decentralized infrastructure fundamentals",
    category: "Decentralized systems",
    minutes: 6,
    summary: "Blocks, consensus, JSON-RPC, gas and what public endpoints can and cannot tell you.",
    sections: [
      { heading: "Blockchains as shared ledgers", kind: "fact", body: [
        "A blockchain is an append-only ledger replicated across many nodes, with a consensus mechanism deciding which blocks are canonical. Bitcoin introduced proof-of-work consensus; Ethereum adds a general-purpose virtual machine for smart contracts and now uses proof-of-stake.",
      ] },
      { heading: "Reading chain data", kind: "fact", body: [
        "EVM nodes expose a JSON-RPC interface (eth_blockNumber, eth_getBalance, eth_call and others). Public RPC endpoints are convenient but can be rate limited, lag behind the chain tip or be temporarily unavailable; production systems usually run or rent dedicated nodes.",
        "Verifying eth_chainId protects against reading from an endpoint that serves a different network than expected — the Web3 Solutions utility does this on every request.",
      ] },
      { heading: "Gas and fee markets", kind: "fact", body: [
        "EIP-1559 introduced a protocol-set base fee per block that is burned, plus an optional priority tip. Base fees rise when blocks are fuller than target and fall when emptier. Layer 2 networks have additional fee components for posting data to Layer 1.",
      ] },
      { heading: "AI agents and on-chain coordination", kind: "hypothesis", body: [
        "Some researchers propose blockchains as coordination and audit layers for autonomous AI agents. Practical designs face open questions around key custody, cost, latency and accountability.",
      ] },
    ],
    sources: [
      { label: "Nakamoto (2008), Bitcoin: A Peer-to-Peer Electronic Cash System", url: "https://bitcoin.org/bitcoin.pdf" },
      { label: "ethereum.org — JSON-RPC API", url: "https://ethereum.org/en/developers/docs/apis/json-rpc/" },
      { label: "EIP-1559: Fee market change for ETH 1.0 chain", url: "https://eips.ethereum.org/EIPS/eip-1559" },
    ],
  },
  {
    slug: "post-quantum-cryptography",
    title: "Post-quantum cryptography fundamentals",
    category: "Cryptography",
    minutes: 6,
    summary: "Why today's public-key cryptography is at long-term risk and what NIST has standardised.",
    sections: [
      { heading: "The threat model", kind: "fact", body: [
        "RSA and elliptic-curve cryptography (used for most blockchain signatures) rely on problems that Shor's algorithm solves efficiently on a sufficiently large fault-tolerant quantum computer. Symmetric ciphers and hash functions are affected less severely; Grover's algorithm roughly halves their effective security level.",
        "Data encrypted today can be stored and decrypted later (“harvest now, decrypt later”), which motivates migrating before such machines exist.",
      ] },
      { heading: "NIST standards (2024)", kind: "fact", body: [
        "In August 2024 NIST published FIPS 203 (ML-KEM, derived from CRYSTALS-Kyber) for key encapsulation, FIPS 204 (ML-DSA, from CRYSTALS-Dilithium) and FIPS 205 (SLH-DSA, from SPHINCS+) for digital signatures.",
      ] },
      { heading: "Implications for blockchains", kind: "open", body: [
        "Migrating blockchains to post-quantum signatures involves larger keys and signatures, higher verification costs and coordinated upgrades. Timelines for cryptographically relevant quantum computers are uncertain and estimates vary widely.",
      ] },
    ],
    sources: [
      { label: "NIST FIPS 203 — Module-Lattice-Based Key-Encapsulation Mechanism Standard", url: "https://csrc.nist.gov/pubs/fips/203/final" },
      { label: "NIST FIPS 204 — Module-Lattice-Based Digital Signature Standard", url: "https://csrc.nist.gov/pubs/fips/204/final" },
      { label: "NIST FIPS 205 — Stateless Hash-Based Digital Signature Standard", url: "https://csrc.nist.gov/pubs/fips/205/final" },
      { label: "Shor (1995) — arXiv:quant-ph/9508027", url: "https://arxiv.org/abs/quant-ph/9508027" },
    ],
  },
];
