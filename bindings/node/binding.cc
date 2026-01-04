#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_gosu();

// "tree-sitter", "language" hashed with BLAKE2
const napi_type_tag LANGUAGE_TYPE_TAG = {0x8AF2E5212AD58ABF,
                                         0xD5006CAD83ABBA16};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  auto language = Napi::Object::New(env);
  language.TypeTag(&LANGUAGE_TYPE_TAG);
  napi_status status =
      napi_wrap(env, language, tree_sitter_gosu(), nullptr, nullptr, nullptr);
  if (status != napi_ok) {
    Napi::Error::New(env, "Failed to wrap language")
        .ThrowAsJavaScriptException();
  }
  exports["language"] = language;
  return exports;
}

NODE_API_MODULE(tree_sitter_gosu_binding, Init)
