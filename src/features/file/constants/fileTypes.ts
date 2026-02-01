/**
 * 图片文件扩展名列表
 */
export const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".ico",
] as const;

/**
 * 判断扩展名是否为图片类型
 */
export function isImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.includes(
    extension.toLowerCase() as (typeof IMAGE_EXTENSIONS)[number],
  );
}
