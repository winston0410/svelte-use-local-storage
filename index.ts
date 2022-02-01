// REF https://github.com/sveltejs/kit/issues/1549
// NOTE Importing cjs module is broken right now in Vite
import type { Action } from "svelte-action-type";
type GroupElement = HTMLFieldSetElement;
type InputElement = HTMLInputElement | HTMLTextAreaElement;
type PersistableElement = InputElement | GroupElement | HTMLElement;

type Storage = "localStorage" | "sessionStorage";

//  import storageOk from 'storage-available'
const storageOk = (type: Storage) => {
  try {
    const storage = window[type],
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

// TODO Should exclude InputElement and GroupElement here
const setInnerHTML: ValueSetter<HTMLElement> = (node, keyName) => {
  const saved = localStorage.getItem(keyName);
  if (saved) {
    node.textContent = saved;
  }
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

const mountInputElementHandler: ValueSetter<InputElement | GroupElement> = (
  node,
  keyName
) => {
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

const mountNormalElementHandler: ValueSetter<HTMLElement> = (node, keyName) => {
  const observer = new MutationObserver(function () {
    localStorage.setItem(keyName, node.textContent);
  });

  // REF https://stackoverflow.com/questions/40195514/mutation-observer-not-detecting-text-change
  observer.observe(node, {
    characterData: true,
    attributes: false,
    childList: false,
    subtree: true,
  });
  return {
    destroy() {
      observer.disconnect();
    },
  };
};

type ActionProps = {
  name: string;
  // NOTE Whether value get from localstorage should be set in the element
  shouldUpdate?: boolean;
};

const defaultOpts = {
  shouldUpdate: true,
};

const useLocalStorage: Action<PersistableElement, ActionProps> = (
  node,
  opts
) => {
  if (!storageOk("localStorage")) {
    console.warn("localStorage is not supported by the current browser.");
    return;
  }

  const { name, shouldUpdate } = { ...defaultOpts, ...opts };

  switch (node.tagName.toLowerCase()) {
    case "fieldset":
      if (shouldUpdate) {
        setRadio(node as GroupElement, name);
      }
      return mountInputElementHandler(node as GroupElement, name);

    case "input":
    case "textarea":
      if (shouldUpdate) {
        setInput(node as InputElement, name);
      }
      return mountInputElementHandler(node as InputElement, name);

    // NOTE For all other HTML elements
    default:
      if (shouldUpdate) {
        setInnerHTML(node as HTMLElement, name);
      }
      return mountNormalElementHandler(node as HTMLElement, name);
  }
};

export default useLocalStorage;
