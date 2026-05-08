/*
  Illustrator ExtendScript for MediTime mobile icon exports.

  Usage:
  1. Open the Illustrator source file.
  2. Keep the icon artwork on transparent artboards. The script adds an
     opaque background only for iOS app-icon PNG exports.
  3. Optional artboard names:
     - icon, app-icon, ios-icon
     - icon-dark, ios-dark
     - icon-tinted, ios-tinted, tinted
     - adaptive-icon, adaptive
     - adaptive-icon-dark, adaptive-dark, monochrome
     - splash-icon, splash
  4. Run this script from Illustrator: File > Scripts > Other Script...

  The script exports icon-only square PNGs. It does not export rectangular logos.
  iOS exports are 1024x1024 without pre-rounded corners; Apple applies masking.
*/

#target illustrator

(function () {
  if (app.documents.length === 0) {
    alert('Open the Illustrator icon document before running this script.');
    return;
  }

  var doc = app.activeDocument;
  var scriptFile = new File($.fileName);
  var mobileDir = scriptFile.parent.parent;

  var outputs = [
    {
      names: ['icon', 'app-icon', 'ios-icon'],
      relativePath: 'assets/icon.png',
      size: 1024,
      transparent: false,
      background: [255, 255, 255]
    },
    {
      names: ['icon-dark', 'ios-dark'],
      fallbackNames: ['icon', 'app-icon', 'ios-icon'],
      relativePath: 'assets/icon-dark.png',
      size: 1024,
      transparent: false,
      background: [12, 18, 24]
    },
    {
      names: ['icon-tinted', 'ios-tinted', 'tinted'],
      fallbackNames: ['icon-dark', 'ios-dark', 'icon', 'app-icon', 'ios-icon'],
      relativePath: 'assets/icon-tinted.png',
      size: 1024,
      transparent: false,
      background: [12, 18, 24]
    },
    {
      names: ['adaptive-icon', 'adaptive'],
      fallbackNames: ['icon', 'app-icon', 'ios-icon'],
      relativePath: 'assets/adaptive-icon.png',
      size: 1024,
      transparent: true
    },
    {
      names: ['adaptive-icon-dark', 'adaptive-dark', 'monochrome'],
      fallbackNames: ['adaptive-icon', 'adaptive', 'icon-dark', 'icon'],
      relativePath: 'assets/adaptive-icon-dark.png',
      size: 1024,
      transparent: true
    },
    {
      names: ['splash-icon', 'splash'],
      fallbackNames: ['icon', 'app-icon', 'ios-icon'],
      relativePath: 'assets/splash-icon.png',
      size: 200,
      transparent: true
    }
  ];

  function normalizeName(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function findArtboard(names) {
    var wanted = {};
    for (var i = 0; i < names.length; i += 1) {
      wanted[normalizeName(names[i])] = true;
    }

    for (var index = 0; index < doc.artboards.length; index += 1) {
      if (wanted[normalizeName(doc.artboards[index].name)]) {
        return index;
      }
    }

    return -1;
  }

  function ensureFolder(folder) {
    if (folder.exists) {
      return;
    }

    ensureFolder(folder.parent);
    folder.create();
  }

  function fileFor(relativePath) {
    var file = new File(mobileDir.fsName + '/' + relativePath);
    ensureFolder(file.parent);
    return file;
  }

  function artboardWidth(index) {
    var rect = doc.artboards[index].artboardRect;
    return Math.abs(rect[2] - rect[0]);
  }

  function exportPng(index, output) {
    doc.artboards.setActiveArtboardIndex(index);

    var scale = (output.size / artboardWidth(index)) * 100;
    var options = new ExportOptionsPNG24();
    options.antiAliasing = true;
    options.artBoardClipping = true;
    options.horizontalScale = scale;
    options.verticalScale = scale;
    options.transparency = output.transparent;

    if (!output.transparent && output.background) {
      var matteColor = new RGBColor();
      matteColor.red = output.background[0];
      matteColor.green = output.background[1];
      matteColor.blue = output.background[2];
      options.matte = true;
      options.matteColor = matteColor;
    }

    doc.exportFile(fileFor(output.relativePath), ExportType.PNG24, options);
  }

  var exported = [];
  var firstArtboard = 0;

  for (var i = 0; i < outputs.length; i += 1) {
    var output = outputs[i];
    var artboard = findArtboard(output.names);

    if (artboard < 0 && output.fallbackNames) {
      artboard = findArtboard(output.fallbackNames);
    }

    if (artboard < 0) {
      artboard = firstArtboard;
    }

    exportPng(artboard, output);
    exported.push(output.relativePath + ' (' + output.size + 'x' + output.size + ')');
  }

  alert('Exported:\n' + exported.join('\n'));
})();
