export interface ParcelIDL {

}

export interface UserIDL {
  whoami(): Promise<{ publicKey: string; }>;
}

export interface SceneIDL {

}
