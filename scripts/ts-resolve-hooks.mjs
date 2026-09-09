export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (
      specifier.startsWith(".") &&
      !specifier.endsWith(".ts") &&
      !specifier.endsWith(".json") &&
      !specifier.endsWith(".tsx")
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw err;
  }
}
