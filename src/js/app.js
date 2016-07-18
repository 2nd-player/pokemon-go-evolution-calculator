'use strict';

var app = angular.module('PogoCalc', [])

app.controller('PogoCalcController', ['$scope', PogoCalcController]);

function PogoCalcController($scope) {
  var CANDY_PER_EVOLUTION = 12;

  $scope.form = {
    pidgey: 1,
    keepPidgey: true,
    pidgeotto: 1,
    keepPidgeotto: true,
    pidgeyCandy: 1
  };

  $scope.$watch('form', function (val) {
    calculate(val);
  }, true);

  function evolve(calculations, resources) {
    calculations.evolutions = calculations.evolutions + 1;
    resources.pidgeys = resources.pidgeys - 1;
    resources.pidgeottos = resources.pidgeottos + 1;
    resources.candy = resources.candy - CANDY_PER_EVOLUTION + 1;
  }

  function generateInstructions(form, calculations) {
    var instructions = [];

    var preEggPidgeottos = parseInt(form.pidgeotto, 10) - (form.keepPidgeotto ? 1 : 0);
    preEggPidgeottos = preEggPidgeottos < calculations.pidgeottoTransfers ? preEggPidgeottos : calculations.pidgeottoTransfers;
    var postEggPidgeottos = calculations.pidgeottoTransfers - parseInt(form.pidgeotto, 10) - (form.keepPidgeotto ? 1 : 0);
    if (preEggPidgeottos > 0) {
      instructions.push('Transfer ' + preEggPidgeottos + ' Pidgeottos.');
    }

    if (calculations.pidgeyTransfers > 0) {
      instructions.push('Transfer ' + calculations.pidgeyTransfers + ' Pidgeys.');
    }

    if (calculations.evolutions > 0) {
      instructions.push('Activate Lucky Egg.');
    } else {
      instructions.push('You can\'t evolve any Pidgeys.');
    }

    var preTransferEvolutions = calculations.evolutions - Math.ceil(postEggPidgeottos / 12);
    if (preTransferEvolutions > 0) {
      instructions.push('Evolve ' + preTransferEvolutions + ' Pidgeys.');
    }

    if (postEggPidgeottos > 0) {
      instructions.push('Transfer ' + postEggPidgeottos + ' Pidgeottos.');
    }

    var postTransferEvolutions = calculations.evolutions - preTransferEvolutions;
    if (postTransferEvolutions > 0) {
      instructions.push('Evolve ' + postTransferEvolutions + ' Pidgeys.');
    }

    $scope.instructions = instructions;
  }

  function calculate(form) {
    var calculations = {
      evolutions: 0,
      pidgeyTransfers: 0,
      pidgeottoTransfers: 0
    };

    var resources = {
      pidgeys: parseInt(form.pidgey, 10) - (form.keepPidgey ? 1 : 0),
      pidgeottos: parseInt(form.pidgeotto, 10) - (form.keepPidgeotto ? 1 : 0),
      candy: parseInt(form.pidgeyCandy, 10)
    };

    if (resources.pidgeys < 0) {
      resources.pidgeys = 0;
    }

    if (resources.pidgeottos < 0) {
      resources.pidgeottos = 0;
    }

    if (resources.candy < 0) {
      resources.candy = 0;
    }

    var done = false;

    while (!done) {
      if (resources.pidgeys <= 0 && resources.pidgeys < 13) {
        done = true;
      } else if (resources.candy >= CANDY_PER_EVOLUTION) {
        evolve(calculations, resources);

      } else if (resources.pidgeottos + resources.candy >= CANDY_PER_EVOLUTION) {
        var pidgeottoToTransfer = CANDY_PER_EVOLUTION - resources.candy;
        calculations.pidgeottoTransfers = calculations.pidgeottoTransfers + pidgeottoToTransfer;
        resources.pidgeottos = resources.pidgeottos - pidgeottoToTransfer;
        resources.candy = resources.candy + pidgeottoToTransfer;
        evolve(calculations, resources);

      } else if (resources.pidgeottos + resources.pidgeys - 1 + resources.candy >= CANDY_PER_EVOLUTION) {
        calculations.pidgeottoTransfers = calculations.pidgeottoTransfers + resources.pidgeottos;
        resources.candy = resources.candy + resources.pidgeottos;
        resources.pidgeottos = 0;
        var pidgeyToTransfer = CANDY_PER_EVOLUTION - resources.candy;
        calculations.pidgeyTransfers = calculations.pidgeyTransfers + pidgeyToTransfer;
        resources.pidgeys = resources.pidgeys - pidgeyToTransfer;
        resources.candy = resources.candy + pidgeyToTransfer;
        evolve(calculations, resources);
        
      } else {
        done = true;
      }
    }

    resources.pidgeys = resources.pidgeys + (form.keepPidgey ? 1 : 0);
    resources.pidgeottos = resources.pidgeottos + (form.keepPidgeotto ? 1 : 0);

    $scope.calculations = calculations;
    $scope.resources = resources;

    generateInstructions(form, calculations);
  }
}
