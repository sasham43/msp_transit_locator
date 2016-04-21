var app = angular.module('transitApp', ['ngMap']);

app.controller('LocationController', ['$http', 'NgMap', function($http, NgMap){
  // used for 'controller as' syntax
  var vm = this;
  // initialize variables
  vm.responseList = [];
  vm.markerList = [];
  vm.routeNumber = 0;
  vm.mapsAPIKey = 'AIzaSyB4sLHNoVaZXg41IyAwcH0zdWrv0OgH9ZM';
  vm.noBusses = false;
  vm.busIcon = 'assets/images/tiny_icon_bus.png';
  vm.trainIcon = 'assets/images/tiny_train_icon.png';

  vm.getVehicleLocations = function(){
    vm.removeMarkers();
    vm.noBusses = false;
    $http.get('http://svc.metrotransit.org/NexTrip/VehicleLocations/' + vm.routeNumber).then(function(response){
      vm.tempObject = {};
      vm.tempMarker = {};
      vm.responseList = [];
      vm.markerList = [];

      vm.responseList = response.data;

      vm.responseList.map(function(object){
        vm.tempObject.lat = object.VehicleLatitude;
        vm.tempObject.lng = object.VehicleLongitude;
        if (vm.routeNumber == 901 || vm.routeNumber == 902 || vm.routeNumber == 903){
          vm.tempMarker = new google.maps.Marker({position: vm.tempObject, icon: vm.trainIcon });
        } else {
          vm.tempMarker = new google.maps.Marker({position: vm.tempObject, icon: vm.busIcon });
        }
        vm.markerList.push(vm.tempMarker);
      });
      if (vm.markerList.length == 0){
        vm.noBusses = true;
      } else {
        vm.noBusses = false;
      }

      console.log('markerlist', vm.markerList);
      vm.updateMap();
    })
  };

    vm.updateMap = function(){
      NgMap.getMap({id: 'map'}).then(function(map) {
        vm.markerList.map(function(marker){
          marker.setMap(map);
        });
      });
      console.log('get map', NgMap.getMap({id: 'map'}).then(function(map){
        console.log('this map', map);
      }));
    };

    vm.removeMarkers = function(){
      NgMap.getMap({id: 'map'}).then(function(map) {
        vm.markerList.map(function(marker){
          marker.setMap(null);
        });
      });
    };

    vm.updateMap();
}]);
