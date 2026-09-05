import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const MEMO = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export async function prepareMemoTransaction(args: {
  payer: string;
  message: string;
  cluster?: "mainnet-beta" | "devnet";
}): Promise<{ transactionBase64: string; cluster: string; lastValidBlockHeight: number }> {
  const cluster = args.cluster ?? "mainnet-beta";
  const endpoint =
    cluster === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";
  const connection = new Connection(endpoint, "confirmed");
  const from = new PublicKey(args.payer);
  const ix = new TransactionInstruction({
    keys: [{ pubkey: from, isSigner: true, isWritable: false }],
    programId: MEMO,
    data: Buffer.from(args.message, "utf8"),
  });
  const tx = new Transaction().add(ix);
  tx.feePayer = from;
  const latest = await connection.getLatestBlockhash();
  tx.recentBlockhash = latest.blockhash;
  return {
    transactionBase64: tx
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64"),
    cluster,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  };
}
