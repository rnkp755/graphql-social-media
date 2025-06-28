import { fileURLToPath } from "url";
import path from "path";

export const getDirname = (importMetaUrl: string) => {
	return path.dirname(fileURLToPath(importMetaUrl));
};
