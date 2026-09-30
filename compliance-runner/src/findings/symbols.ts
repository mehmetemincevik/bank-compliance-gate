import { Node, Project, SourceFile } from 'ts-morph';
import { join } from 'path';

// satır numarasından sembol adı: Class.member ya da top-level isim
export class SymbolResolver {
  private readonly project = new Project({ skipAddingFilesFromTsConfig: true });
  private readonly cache = new Map<string, SourceFile | undefined>();

  constructor(private readonly root: string) {}

  private file(rel: string): SourceFile | undefined {
    if (!this.cache.has(rel)) {
      try {
        this.cache.set(rel, this.project.addSourceFileAtPath(join(this.root, rel)));
      } catch {
        this.cache.set(rel, undefined);
      }
    }
    return this.cache.get(rel);
  }

  resolve(rel: string, line: number): string | undefined {
    if (!/\.(ts|tsx)$/.test(rel) || line <= 0) return undefined;
    const sf = this.file(rel);
    if (!sf) return undefined;

    const contains = (n: Node) => n.getStartLineNumber() <= line && line <= n.getEndLineNumber();

    for (const cls of sf.getClasses()) {
      if (!contains(cls)) continue;
      const member = cls.getMembers().find(contains);
      const clsName = cls.getName() ?? '<anonim>';
      if (member && 'getName' in member && typeof member.getName === 'function') {
        return `${clsName}.${member.getName()}`;
      }
      if (member && Node.isConstructorDeclaration(member)) return `${clsName}.constructor`;
      return clsName;
    }

    for (const v of sf.getVariableDeclarations()) if (contains(v)) return v.getName();
    for (const f of sf.getFunctions()) if (contains(f)) return f.getName();
    return undefined;
  }
}
