import type { NavGroup, SiteEntry } from '../data/groups';
import { getPinyinInitials, isLatinQuery } from './pinyin';

export interface SiteSearchHit {
  site: SiteEntry;
  group: NavGroup;
  /** 命中的别名（若是通过别名命中） */
  matchedAlias?: string;
}

export interface SearchResults {
  sites: SiteSearchHit[];
  groups: NavGroup[];
}

function matchesText(target: string, query: string, lowerQuery: string, latin: boolean): boolean {
  if (!target) return false;
  if (target.toLowerCase().includes(lowerQuery)) return true;
  if (latin && getPinyinInitials(target).includes(lowerQuery)) return true;
  return false;
}

/** 在给定的编组数据里搜索（数据来自本地存储，用户增删改即时生效） */
export function searchAll(rawQuery: string, groups: NavGroup[]): SearchResults {
  const query = rawQuery.trim();
  if (!query) return { sites: [], groups: [] };
  const lowerQuery = query.toLowerCase();
  const latin = isLatinQuery(query);

  const siteHits: SiteSearchHit[] = [];
  const groupHits: NavGroup[] = [];

  for (const group of groups) {
    const groupMatched =
      matchesText(group.name, query, lowerQuery, latin) ||
      (group.aliases ?? []).some((a) => matchesText(a, query, lowerQuery, latin));
    if (groupMatched) groupHits.push(group);

    for (const site of group.sites) {
      let matchedAlias: string | undefined;
      let matched = matchesText(site.name, query, lowerQuery, latin);
      if (!matched) {
        for (const alias of site.aliases ?? []) {
          if (matchesText(alias, query, lowerQuery, latin)) {
            matched = true;
            matchedAlias = alias;
            break;
          }
        }
      }
      if (!matched && matchesText(site.description, query, lowerQuery, latin)) {
        matched = true;
      }
      if (matched) siteHits.push({ site, group, matchedAlias });
    }
  }

  // 排序：名称/别名直命中优先，其次置顶与频率
  siteHits.sort((a, b) => {
    const score = (h: SiteSearchHit) =>
      (h.matchedAlias ? 2 : 0) + (h.site.pinned ? 1 : 0) + h.site.frequency / 1000;
    return score(b) - score(a);
  });

  return { sites: siteHits.slice(0, 8), groups: groupHits.slice(0, 4) };
}

/** 在单个编组内搜索 */
export function searchInGroup(group: NavGroup, rawQuery: string): SiteEntry[] {
  const query = rawQuery.trim();
  if (!query) return group.sites;
  const lowerQuery = query.toLowerCase();
  const latin = isLatinQuery(query);
  return group.sites.filter(
    (site) =>
      matchesText(site.name, query, lowerQuery, latin) ||
      (site.aliases ?? []).some((a) => matchesText(a, query, lowerQuery, latin)),
  );
}
