/*
 * View model for OctoPrint-PrintTimeEstimator
 *
 * Author: Eyal
 * License: AGPLv3
 */
$(function() {
  function PrintTimeEstimatorViewModel(parameters) {
    var self = this;

    self.settingsViewModel = parameters[0];
    self.printerStateViewModel = parameters[1];

    self.onBeforeBinding = function() {
      let settings = self.settingsViewModel.settings;
      let printTimeEstimatorSettings = settings.plugins.PrintTimeEstimator;
      self.analyzers = printTimeEstimatorSettings.analyzers;
      self.exactDurations = printTimeEstimatorSettings.exactDurations;
      self.enableOctoPrintAnalyzer = printTimeEstimatorSettings.enableOctoPrintAnalyzer;
      // Overwrite the formatFuzzyPrintTime as needed.
      self.originalFormatFuzzyPrintTime = formatFuzzyPrintTime;
      formatFuzzyPrintTime = function() {
        if (self.exactDurations()) {
          return formatDuration.apply(null, arguments);
        } else {
          return self.originalFormatFuzzyPrintTime.apply(null, arguments);
        }
      }

      // Overwrite the printTimeLeftOriginString function
      self.originalPrintTimeLeftOriginString = self.printerStateViewModel.printTimeLeftOriginString;
      self.printerStateViewModel.printTimeLeftOriginString = ko.pureComputed(function() {
        let value = self.printerStateViewModel.printTimeLeftOrigin();
        switch (value) {
          case "genius": {
            return gettext("Based on a line-by-line preprocessing of the gcode (excellent accuracy)");
          }
          default: {
            return self.originalPrintTimeLeftOriginString();
          }
        }
      });

      // Overwrite the printTimeLeftOriginClass function
      self.originalPrintTimeLeftOriginClass = self.printerStateViewModel.printTimeLeftOriginClass;
      self.printerStateViewModel.printTimeLeftOriginClass = ko.pureComputed(function() {
        let value = self.printerStateViewModel.printTimeLeftOrigin();
        switch (value) {
          case "genius": {
            return "print-time-genius";
          }
          default: {
            return self.originalPrintTimeLeftOriginClass();
          }
        }
      });
      self.printerStateViewModel.printTimeLeftOrigin.valueHasMutated();

      self.exactDurations.subscribe(function (newValue) {
        self.printerStateViewModel.estimatedPrintTime.valueHasMutated();
        self.printerStateViewModel.lastPrintTime.valueHasMutated();
        self.printerStateViewModel.printTimeLeft.valueHasMutated();
      })

    }

    self.addAnalyzer = function() {
      self.analyzers.push({command: "", enabled: true});
    }

    self.removeAnalyzer = function(analyzer) {
      self.analyzers.remove(analyzer);
    }
  }

  /* view model class, parameters for constructor, container to bind to
   * Please see http://docs.octoprint.org/en/master/plugins/viewmodels.html#registering-custom-viewmodels for more details
   * and a full list of the available options.
   */
  OCTOPRINT_VIEWMODELS.push({
    construct: PrintTimeEstimatorViewModel,
    // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
    dependencies: ["settingsViewModel", "printerStateViewModel"],
    // Elements to bind to, e.g. #settings_plugin_PrintTimeEstimator, #tab_plugin_PrintTimeEstimator, ...
    elements: [ "#settings_plugin_PrintTimeEstimator" ]
  });
});
