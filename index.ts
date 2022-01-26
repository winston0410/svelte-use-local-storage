// REF https://github.com/sveltejs/kit/issues/1549
// NOTE Importing cjs module is broken right now in Vite
//  import storageOk from 'storage-available'

//  Taken from this repo, as these types should be merged to core later
//  https://github.com/paolotiu/svelte-useactions/blob/main/src/index.ts
/**
 * The return type of an action.
 */
export type ActionReturn<Params> = {
  destroy?: () => void;
  update?: (params: Params) => void;
} | void;

/**
 * Action type shim
 */
export type ActionLike<Node extends HTMLElement> = (
  node: Node,
  params: unknown
) => unknown;

/**
 * A primitive Action
 */
export type Action<Node extends HTMLElement = HTMLElement, Params = unknown> = (
  node: Node,
  params?: Params
) => ActionReturn<Params>;

type GroupElement = HTMLFieldSetElement;
type InputElement = HTMLInputElement | HTMLTextAreaElement;
type PersistableElement = InputElement | GroupElement;

type Storage = "localStorage" | "sessionStorage";

const storageOk = (type: Storage) => {
  try {
    var storage = window[type],
      x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

type ValueSetter<T extends PersistableElement> = (
  node: T,
  keyName: string
) => void;

const setInput: ValueSetter<InputElement> = (node, keyName) => {
  const saved = localStorage.getItem(keyName);
  node.value = saved;
};

const setRadio: ValueSetter<GroupElement> = (node, keyName) => {
  const savedKey = localStorage.getItem(keyName);
  const targetButton = ([...node.elements] as Array<HTMLInputElement>).find(
    (x) => x.value === savedKey
  );

  if (targetButton) {
    targetButton.checked = true;
  }
};

const useLocalStorage: Action<PersistableElement, string> = (node, keyName) => {
  if (!storageOk("localStorage")) {
    console.warn("localStorage is not supported by the current browser.");
    return;
  }

  switch (node.tagName.toLowerCase()) {
    case "fieldset":
      setRadio(node as GroupElement, keyName);
      break;

    default:
      setInput(node as InputElement, keyName);
      break;
  }

  const handleChange = (e: InputEvent) => {
    localStorage.setItem(keyName, (e.target as HTMLInputElement).value);
  };

  node.addEventListener("change", handleChange);

  return {
    destroy() {
      node.removeEventListener("change", handleChange);
    },
  };
};

export default useLocalStorage;
