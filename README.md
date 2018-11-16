# Component rollup config

> Extensible rollup configuration to build OVH components.

[![Downloads](https://badgen.net/npm/dt/@ovh-ux/component-rollup-config)](https://npmjs.com/package/@ovh-ux/component-rollup-config) [![Dependencies](https://badgen.net/david/dep/ovh-ux/component-rollup-config)](https://npmjs.com/package/@ovh-ux/component-rollup-config?activeTab=dependencies) [![Dev Dependencies](https://badgen.net/david/dev/ovh-ux/component-rollup-config)](https://npmjs.com/package/@ovh-ux/component-rollup-config?activeTab=dependencies) [![Gitter](https://badgen.net/badge/gitter/ovh-ux/blue?icon=gitter)](https://gitter.im/ovh/ux)

## Install

```sh
yarn add -D @ovh-ux/component-rollup-config
```

## Usage

The default configuration has multiple targets: CommonJS and UMD.

```js
import config from '@ovh-ux/component-rollup-config';

export default config({
  input: 'src/index.js'
})
```

### CommonJS

To target only a CommonJS build.

```js
import config from '@ovh-ux/component-rollup-config';

export default config.cjs({
  input: 'src/index.js'
})
```

### UMD

To target only an UMD build.

```js
import config from '@ovh-ux/component-rollup-config';

export default config.umd({
  input: 'src/index.js'
}, 'myLibrary', {
  angular: 'angular',
})
```

## Plugins

This configuration provides some plugins to facilitate loading and importing of ovh translations.

### translation-xml

Convert translation XML files to JavaScript.

```xml
<translations>
  <translation id="foo" qtlid="1">Foo</translation>
  <translation id="bar" qtlid="2">Bar</translation>
</translations>
```

```js
export default { foo: 'Foo', bar: 'Bar' };
```

### translation-ui-router

Handle `translations` property in ui-router state declaration to dynamically load ovh translations when state is resolved.

```js
// will import `./translations` and `../common/translations` during ui-router state resolve
$stateProvider.state('my-state', {
  url: 'some-template.html',
  translations: ['.', '../common'],
});
```

### translation-inject

Handle `@ngTranslationsInject` comment in order to facilitate dynamic import of ovh translations.

The format is as follows: `@ngTranslationsInject:{format} [translations]`

`format` is a string which represent the format of translations files (xml, json, ...)
`translations` is multiple strings separated by a space

```js
angular
  .module('myModule', [])
  .run(/* @ngTranslationsInject ./translations ../common/translations */); // Load .translations and ../common/translations in xml
  .run(/* @ngTranslationsInject:xml ./translations ../common/translations */); // Load .translations and ../common/translations in xml
  .run(/* @ngTranslationsInject:json ./translations ../common/translations */); // Load .translations and ../common/translations in json
```

```js
class MyController {
  constructor($injector) {
    'ngInject';

    this.$injector = $injector;
  }

  $onInit() {
    this.isLoading = true;
    return this.$injector.invoke(
      /* @ngTranslationsInject ./translations ./some/other/path */
    ).finally(() => {
      this.isLoading = false;
    });
  }
}

angular
  .module('myModule', [])
  .controller('myController', MyController);
```

## Test

```sh
yarn test
```

## Contributing

Always feel free to help out! Whether it's [filing bugs and feature requests](https://github.com/ovh-ux/component-rollup-config/issues/new) or working on some of the [open issues](https://github.com/ovh-ux/component-rollup-config/issues), our [contributing guide](CONTRIBUTING.md) will help get you started.

## License

[BSD-3-Clause](LICENSE) © OVH SAS
