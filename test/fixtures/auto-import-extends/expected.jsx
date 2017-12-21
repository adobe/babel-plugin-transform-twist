import { Store as _Store } from '@twist/core';
import { StoreDecorator as _StoreDecorator } from '@twist/core';
@_StoreDecorator
export class MyStore extends _Store {
}

@_StoreDecorator
export class MySubStore extends MyStore {
}
