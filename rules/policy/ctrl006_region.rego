# CTRL-006 veri yerelliği
package main

import rego.v1

allowed := {r | some r in data["ctrl-006"].allowed_regions}

provider_region[addr] := p.region if {
	some name, blocks in input.provider
	some p in blocks
	not p.alias
	addr := name
}

provider_region[addr] := p.region if {
	some name, blocks in input.provider
	some p in blocks
	addr := sprintf("%s.%s", [name, p.alias])
}

# varsayılan provider
deny contains res if {
	some name, blocks in input.provider
	some p in blocks
	not p.alias
	not p.region in allowed
	res := {
		"msg": sprintf("provider.%s bölgesi '%s' izinli listede değil %v", [name, p.region, allowed]),
		"metadata": {"control": "CTRL-006", "symbol": sprintf("provider.%s", [name])},
	}
}

# alias'lı provider kullanan kaynaklar
deny contains res if {
	some rtype, instances in input.resource
	some rname, blocks in instances
	some r in blocks
	ref := trim_suffix(trim_prefix(r.provider, "${"), "}")
	region := provider_region[ref]
	not region in allowed
	res := {
		"msg": sprintf("%s.%s, '%s' provider'ı üzerinden '%s' bölgesine konuşlanıyor", [rtype, rname, ref, region]),
		"metadata": {"control": "CTRL-006", "symbol": sprintf("%s.%s", [rtype, rname])},
	}
}
