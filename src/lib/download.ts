/**
 * 统一的文件下载工具
 */

/**
 * 下载 Blob 文件
 * @param blob - Blob 数据
 * @param filename - 下载文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 从 API 获取并下载文件
 * @param fetchFn - 获取 Blob 的异步函数
 * @param filename - 下载文件名
 */
export async function downloadFile(
  fetchFn: () => Promise<Blob>,
  filename: string,
): Promise<void> {
  const blob = await fetchFn();
  downloadBlob(blob, filename);
}
