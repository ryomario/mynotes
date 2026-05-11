export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId: string;
  thumbnail?: string;
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
