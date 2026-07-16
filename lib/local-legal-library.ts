import type { LegalDocument } from "./legal-catalog";

const DATABASE_NAME = "criminal-procedure-local-legal-library";
const DATABASE_VERSION = 1;
const DOCUMENT_STORE = "documents";
const CONTENT_STORE = "contents";

export const MAX_LOCAL_LEGAL_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_LOCAL_LEGAL_FILES = 60;

const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "json"]);
const SUPPORTED_EXTENSIONS = new Set([...TEXT_EXTENSIONS, "pdf"]);

export type LocalLegalDocument = LegalDocument & {
  local: true;
  mime_type: string;
  size: number;
  uploaded_at: string;
};

export type LocalLegalContent = {
  id: string;
  blob: Blob;
  text: string;
  mimeType: string;
  fileName: string;
};

export type LocalLegalImportResult = {
  imported: LocalLegalDocument[];
  skipped: string[];
  rejected: Array<{ fileName: string; reason: string }>;
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("本地法律库读取失败"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("本地法律库写入失败"));
    transaction.onabort = () => reject(transaction.error ?? new Error("本地法律库写入已取消"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("当前浏览器不支持本地法律库"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DOCUMENT_STORE)) {
        const documents = database.createObjectStore(DOCUMENT_STORE, { keyPath: "id" });
        documents.createIndex("uploaded_at", "uploaded_at");
      }
      if (!database.objectStoreNames.contains(CONTENT_STORE)) database.createObjectStore(CONTENT_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开本地法律库"));
  });
}

function extensionOf(fileName: string) {
  return fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
}

function titleOf(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "未命名本地法律文件";
}

function validateFile(file: File) {
  const extension = extensionOf(file.name);
  if (!file.size) throw new Error("文件为空");
  if (file.size > MAX_LOCAL_LEGAL_FILE_BYTES) throw new Error("单个文件不得超过20MB");
  if (!SUPPORTED_EXTENSIONS.has(extension)) throw new Error("仅支持 TXT、Markdown、JSON 和 PDF 文件");
  return extension;
}

async function sha256(blob: Blob) {
  if (!globalThis.crypto?.subtle) throw new Error("当前浏览器不支持文件完整性校验");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function listLocalLegalDocuments(): Promise<LocalLegalDocument[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DOCUMENT_STORE, "readonly");
    const documents = await requestResult(transaction.objectStore(DOCUMENT_STORE).getAll()) as LocalLegalDocument[];
    await transactionComplete(transaction);
    return documents.sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  } finally {
    database.close();
  }
}

export async function importLocalLegalFiles(files: File[]): Promise<LocalLegalImportResult> {
  const result: LocalLegalImportResult = { imported: [], skipped: [], rejected: [] };
  if (!files.length) return result;

  const existingDocuments = await listLocalLegalDocuments();
  const existingIds = new Set(existingDocuments.map((document) => document.id));
  const database = await openDatabase();

  try {
    for (const file of files) {
      try {
        const extension = validateFile(file);
        const fileHash = await sha256(file);
        const id = `local-${fileHash}`;
        if (existingIds.has(id)) {
          result.skipped.push(file.name);
          continue;
        }
        if (existingIds.size >= MAX_LOCAL_LEGAL_FILES) throw new Error(`本地法律文件已达到上限${MAX_LOCAL_LEGAL_FILES}份`);

        const isText = TEXT_EXTENSIONS.has(extension);
        const text = isText ? (await file.text()).replace(/^\uFEFF/, "") : "";
        const uploadedAt = new Date().toISOString();
        const document: LocalLegalDocument = {
          id,
          title: titleOf(file.name),
          level: "本地法律文件",
          authority: "本地导入",
          source_group: "local",
          topics: ["general"],
          coverage: isText ? "本地全文" : "本地PDF（未提取文字）",
          effective: "未标注",
          points: isText ? "本地上传的法律资料，可在当前浏览器中检索和阅读。" : "本地上传的PDF法律资料，可在当前浏览器中预览。",
          filename: file.name,
          chars: text.length,
          sha256: fileHash,
          checked_at: uploadedAt.slice(0, 10),
          local: true,
          mime_type: file.type || (extension === "pdf" ? "application/pdf" : "text/plain"),
          size: file.size,
          uploaded_at: uploadedAt,
        };
        const content: LocalLegalContent = { id, blob: file, text, mimeType: document.mime_type, fileName: file.name };
        const transaction = database.transaction([DOCUMENT_STORE, CONTENT_STORE], "readwrite");
        transaction.objectStore(DOCUMENT_STORE).put(document);
        transaction.objectStore(CONTENT_STORE).put(content);
        await transactionComplete(transaction);
        existingIds.add(id);
        result.imported.push(document);
      } catch (error) {
        result.rejected.push({ fileName: file.name, reason: error instanceof Error ? error.message : "导入失败" });
      }
    }
  } finally {
    database.close();
  }

  if (result.imported.length && navigator.storage?.persist) void navigator.storage.persist();
  return result;
}

export async function readLocalLegalContent(id: string): Promise<LocalLegalContent | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(CONTENT_STORE, "readonly");
    const content = await requestResult(transaction.objectStore(CONTENT_STORE).get(id)) as LocalLegalContent | undefined;
    await transactionComplete(transaction);
    return content ?? null;
  } finally {
    database.close();
  }
}

export async function removeLocalLegalDocument(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([DOCUMENT_STORE, CONTENT_STORE], "readwrite");
    transaction.objectStore(DOCUMENT_STORE).delete(id);
    transaction.objectStore(CONTENT_STORE).delete(id);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export function formatLocalLegalFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
