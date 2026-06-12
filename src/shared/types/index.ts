export interface Note {
  id: string;
  content: string;
  updatedAt: number;
  pinned?: boolean;
  locked?: boolean;
  order?: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId: string;
  createdAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface BookmarkSettings {
  defaultFolderId: string;
  openNewBookmarkInNewTab: boolean;
  showUrlInCard: boolean;
}
