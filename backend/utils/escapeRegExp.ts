/** Kullanıcı girdisini $regex sorgularında güvenle kullanmak için özel karakterleri escape eder (ReDoS/regex injection önlemi). */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
