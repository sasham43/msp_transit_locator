var app = angular.module('transitApp', ['ngMap']);

app.controller('LocationController', ['$http', 'NgMap', function($http, NgMap){
  // used for 'controller as' syntax
  var vm = this;
  // initialize variables
  vm.responseList = [];
  vm.markerList = [];
  vm.routeNumber = 0;
  vm.mapsAPIKey = 'AIzaSyB4sLHNoVaZXg41IyAwcH0zdWrv0OgH9ZM';
  vm.noBuses = false;
  vm.busIcon = 'assets/images/tiny_icon_bus.png';
  vm.busIcon2 = 'assets/images/tiny_icon_bus2.png';
  vm.trainIcon = 'assets/images/tiny_train_icon.png';
  vm.trainIcon2 = 'assets/images/tiny_train_icon2.png';

  vm.testDate = "/Date(1461336899000-0500)/";
  vm.regExp = /\d\d\d\d\d\d\d\d\d\d\d\d\d\W\d\d\d\d/;
  //vm.actualDate = new Date(parseInt(vm.testDate.match(vm.regExp)));

  vm.getVehicleLocations = function(loc){
    vm.removeMarkers(); // remove any markers that may be on the map before adding more
    vm.noBuses = false; // hide no buses warning
    $http.get('http://svc.metrotransit.org/NexTrip/VehicleLocations/' + vm.routeOptions.selectedOption.id).then(function(response){
      // empty out variables
      vm.tempObject = {};
      vm.tempMarker = {};
      vm.responseList = [];
      vm.markerList = [];

      if(loc){
        var user_location = new google.maps.LatLng(loc.lat, loc.lng);

        var user_circle = new google.maps.Circle({
          center: user_location,
          radius: 1609
        });

        var circle_bounds = user_circle.getBounds();
      }

      // pass response from server into list variable
      vm.responseList = response.data;
      console.log('responseList:', vm.responseList);

      // loop through list of response objects and pull out longitude, latitude, and reported time
      vm.responseList.map(function(object){
        // parse datestring
        vm.dateString = object.LocationTime;
        vm.actualDate = new Date(parseInt(vm.dateString.match(vm.regExp)));

        // pull out longitude and latitude
        vm.tempObject.lat = object.VehicleLatitude;
        vm.tempObject.lng = object.VehicleLongitude;
        // check if vehicle route is a train based on route number
        vm.isTrain = vm.routeOptions.selectedOption.id == 901 || vm.routeOptions.selectedOption.id == 902 || vm.routeOptions.selectedOption.id == 903 || vm.routeOptions.selectedOption.id == 888;
        if (vm.isTrain){
          // check train direction
          if (object.Direction === 1 || object.Direction === 2){
            vm.tempMarker = new google.maps.Marker({position: vm.tempObject, icon: vm.trainIcon }); // create marker with train icon
          } else {
            vm.tempMarker = new google.maps.Marker({position: vm.tempObject, icon: vm.trainIcon2 }); // create marker with inverted train icon
          }

        } else {
          // check bus direction
          if (object.Direction === 1 || object.Direction === 2){
            vm.tempMarker = new google.maps.Marker({position: vm.tempObject, icon: vm.busIcon }); // create marker with bus icon
          } else {
            vm.tempMarker = new google.maps.Marker({position: vm.tempObject, icon: vm.busIcon2 }); // create marker with inverted bus icon
          }

        }
        // add parsed date to marker object
        vm.tempMarker.locationTime = vm.actualDate;
        // add marker to new list so we can loop through it later
        if(loc){
          // var user_location = new google.maps.LatLng(loc.lat, loc.lng);
          //
          // var user_circle = new google.maps.Circle({
          //   center: user_location,
          //   radius: 1609
          // });
          //
          // var circle_bounds = user_circle.getBounds();
          if(circle_bounds.contains(vm.tempMarker.getPosition())){
            vm.markerList.push(vm.tempMarker);
          }
        } else {
          vm.markerList.push(vm.tempMarker);
        }
      });
      // check if list is empty, if so show warning element
      if (vm.markerList.length == 0){
        vm.noBuses = true;
      } else {
        vm.noBuses = false;
      }

      // run update map function to add markers and info windows
      vm.updateMap();
    });
  };

  // init map listeners
  NgMap.getMap({id: 'map'}).then(function(map){
    console.log('we got a map')
    map.addListener('click', function(evt){
      console.log('we clicked!', evt.latLng.lat());
      var location = {
        lat: evt.latLng.lat(),
        lng: evt.latLng.lng()
      };

      vm.getVehicleLocations(location)
    });
  });

  vm.updateMap = function(){
    // get map based on id and run operations
    NgMap.getMap({id: 'map'}).then(function(map) {
      // center map on first marker & zoom in
      map.setCenter(vm.markerList[0].position);
      map.setZoom(12);

      // loop through marker list and add them to the map along with an associated info window
      vm.markerList.map(function(marker){
        // add marker to map
        marker.setMap(map);

        // initialize info window, create time string for display
        var infowindow = new google.maps.InfoWindow({
          content: 'Location reported at: ' + marker.locationTime.toTimeString()
        });
        // add info window to map
        marker.addListener('click', function() {
          infowindow.open(map, marker);
        });
      });
    });
  };

  vm.removeMarkers = function(){
    NgMap.getMap({id: 'map'}).then(function(map) {
      // loop through marker list and set them all to none to remove them from the map display
      vm.markerList.map(function(marker){
        marker.setMap(null);
      });
    });
  };

  //getLocation();

  // find users' position
  vm.getLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
  };
  function showPosition(position) {
      console.log("Latitude: " + position.coords.latitude +
      "<br>Longitude: " + position.coords.longitude);
      vm.userPosition = {lat: position.coords.latitude, lng: position.coords.longitude};
      NgMap.getMap({id:'map'}).then(function(map){
        var userMarker = new google.maps.Marker({position: vm.userPosition});
        userMarker.setMap(map);
      });
  }

  // list out route options for dropdown.  Also choose default selected option
  vm.routeOptions = {
    availableOptions: [
    {id: 0, name: "Select a route!"},
    {id:901, name:"METRO Blue Line"},
    {id:902, name:"METRO Green Line"},
    {id:903, name:"METRO Red Line"},
    {id:888, name:"Northstar Commuter Rail"},
    {id:2, name:"2 - Franklin Av - Riverside Av - U of M - 8th St SE"},
    {id:3, name:"3 - U of M - Como Av - Energy Park Dr - Maryland Av"},
    {id:4, name:"4 - New Brighton - Johnson St - Bryant Av - Southtown"},
    {id:5, name:"5 - Brklyn Center - Fremont - 26th Av - Chicago - MOA"},
    {id:6, name:"6 - U of M - Hennepin - Xerxes - France - Southdale"},
    {id:7, name:"7 - Plymouth - 27Av - Midtown - 46St LRT - 34Av S"},
    {id:9, name:"9 - Glenwood Av - Wayzata Blvd - Cedar Lk Rd -46St LRT"},
    {id:10, name:"10 - Central Av - University Av - Northtown"},
    {id:11, name:"11 - Columbia Heights - 2nd St NE - 4th Av S"},
    {id:12, name:"12 - Uptown - Excelsior Blvd - Hopkins - Opus"},
    {id:14, name:"14 - Robbinsdale-West Broadway-Bloomington Av"},
    {id:16, name:"16 - U of M - University Av - Midway"},
    {id:17, name:"17 - Minnetonka Blvd - Uptown - Washington St NE"},
    {id:18, name:"18 - Nicollet Av - South Bloomington"},
    {id:19, name:"19 - Olson Memorial Hwy - Penn Av N - Brooklyn Center"},
    {id:20, name:"20 - Northstar Rail-Downtown Shuttle"},
    {id:21, name:"21 - Uptown - Lake St - Selby  Av"},
    {id:22, name:"22 - Brklyn Ctr - Lyndale Av N - Cedar - 28th Av S - VA"},
    {id:23, name:"23 - Uptown - 38th St - Highland Village"},
    {id:25, name:"25 - Northtown - Silver Lake - Stinson - Lake of Isles"},
    {id:27, name:"27 - Lake St Station-26/28St"},
    {id:30, name:"30 - Broadway Crosstown - Westgate Station"},
    {id:32, name:"32 - Robbinsdale - Lowry Av - Rosedale"},
    {id:39, name:"39 - Wells Fargo - Abbott NW and Children&#39;s Hospitals"},
    {id:46, name:"46 - 50St - 46St - 46St LRT- Highland Village"},
    {id:53, name:"53 - Ltd Stop - Uptown - Lake St - Marshall Av"},
    {id:54, name:"54 - Ltd Stop - W 7St - Airport - MOA"},
    {id:59, name:"59 - Ltd Stop - Blaine - Hwy 65 - Central - Mpls"},
    {id:61, name:"61 - E Hennepin Av - Larpenteur Av - Arcade St"},
    {id:62, name:"62 - Rice St - Little Canada - Shoreview - Signal Hills"},
    {id:63, name:"63 - Grand Av - Raymond Sta - Sunray - McKnight Rd"},
    {id:64, name:"64 - Payne - Maryland - White Bear Av - Maplewood"},
    {id:65, name:"65 - Dale St - Co Rd B - Rosedale"},
    {id:67, name:"67 - W Minnehaha - Raymond Sta - Hiawatha"},
    {id:68, name:"68 - Jackson St - Robert St. - 5th Av. - Inver Hills"},
    {id:70, name:"70 - St Clair Av - W 7St - Burns Av - Sunray"},
    {id:71, name:"71 - Little Canada - Edgerton - Concord - Inver Hills"},
    {id:74, name:"74 - 46St - Randolph - W 7St - E 7St - Sunray"},
    {id:75, name:"75 - Stryker - Robert - Parkview Plaza - Lake Cove Apts"},
    {id:80, name:"80 - Maplewood - White Bear Av - Sunray"},
    {id:83, name:"83 - HarMar Target - Lexington Av"},
    {id:84, name:"84 - Rosedale - Snelling - 46th St LRT - Sibley Plaza"},
    {id:87, name:"87 - Rosedale - U of M St Paul - Cleveland Av"},
    {id:94, name:"94 - Express - Mpls - St Paul"},
    {id:111, name:"111 - Ltd Stop - 66th St - Chicago - Cedar - U of M"},
    {id:113, name:"113 - Ltd Stop - Grand Av S - Lyndale Av S - U of M"},
    {id:114, name:"114 - Ltd Stop - Excelsior Blvd - Uptown - U of M"},
    {id:115, name:"115 - Ltd Stop - Grand Av S - Uptown - U of M"},
    {id:118, name:"118 - Ltd Stop - Central Av - Lowry Av - U of M"},
    {id:120, name:"120 - U of M Stadium Super Shuttle"},
    {id:121, name:"121 - U of M - Campus Connector"},
    {id:122, name:"122 - U of M - University Ave Circulator"},
    {id:123, name:"123 - U of M - 4th Street Circulator"},
    {id:124, name:"124 - U of M - Saint Paul Circulator"},
    {id:129, name:"129 - U of M - Huron Shuttle"},
    {id:133, name:"133 - Ltd Stop - Bloomington Av - Chicago Av - Mpls"},
    {id:134, name:"134 - Ltd Stop - Cleveland Av - Cretin Av - Mpls"},
    {id:135, name:"135 - Ltd Stop - Grand Av S - 35th St - 36th St - Mpls"},
    {id:141, name:"141 - Ltd Stop - New Brighton - Johnson St - Mpls"},
    {id:146, name:"146 - Ltd Stop -  Vernon Av - 50th St - Mpls"},
    {id:156, name:"156 - Express - 58th St - 56th St - Diamond Lake - Mpls"},
    {id:219, name:"219 - Maplewood - Century Av - Hadley Av - Sunray"},
    {id:223, name:"223 - Rosedale - Little Canada - Maplewood"},
    {id:225, name:"225 - Deluxe - Roseville - Coventry - Rosedale"},
    {id:227, name:"227 - Target Shoreview - Victoria - Rosedale"},
    {id:250, name:"250 - Express - St Josephs P&amp;R - 95Av P&amp;R - Mpls"},
    {id:252, name:"252 - 95AV P&amp;R- U of M"},
    {id:261, name:"261 - Express - Shoreview - Roseville - Mpls"},
    {id:262, name:"262 - Ltd Stop - 95Av P&amp;R - Rice St - St Paul"},
    {id:263, name:"263 - Express - Rice St Park and Ride - Roseville"},
    {id:264, name:"264 - Express - Co Rd C Park and Ride - Roseville"},
    {id:265, name:"265 - Express - White Bear Lake - Maplewood - St Paul"},
    {id:270, name:"270 - Express - Mahtomedi - Maplewood - Minneapolis"},
    {id:272, name:"272 - Express - Maplewood - Roseville - U of M"},
    {id:275, name:"275 - Express - Forest Lake-Running Aces - St Paul"},
    {id:288, name:"288 - Express - Forest Lake - Mpls"},
    {id:294, name:"294 - Express - Oakdale - Stillwater - St Paul"},
    {id:350, name:"350 - Ltd Stop - Sunray - McKnight - St Paul"},
    {id:351, name:"351 - Express - Woodbury - St Paul"},
    {id:353, name:"353 - Express - Woodbury - St Paul - Mpls"},
    {id:355, name:"355 - Express - Woodbury - Mpls"},
    {id:361, name:"361 - Express - Cottage Grove - St Paul"},
    {id:364, name:"364 - Express - Newport - Cottage Grove - St Paul"},
    {id:365, name:"365 - Express - Cottage Grove - Mpls"},
    {id:375, name:"375 - Express - Oakdale - Mpls"},
    {id:415, name:"415 - MOA - Mendota Heights - Eagan"},
    {id:417, name:"417 - Mendota Heights - St Paul"},
    {id:420, name:"420 - Rosemount-Apple Valley Flex"},
    {id:421, name:"421 - Burnsville-Savage Flex"},
    {id:426, name:"426 - Burnsville Shuttle"},
    {id:436, name:"436 - Eagan Hwy 55 Rev Comm"},
    {id:437, name:"437 - Eagan Cedar Grove Rev Comm"},
    {id:438, name:"438 - Cliff Lake Flex"},
    {id:440, name:"440 - Apple Valley-Cedar Grove-VA Hospital"},
    {id:442, name:"442 - Burnsville Center-Apple Valley"},
    {id:444, name:"444 - Savage-Burnsville-Mall of America"},
    {id:445, name:"445 - Eagan-Cedar Grove"},
    {id:446, name:"446 - Eagan-46th Street LRT"},
    {id:452, name:"452 - Express - West St Paul - Mpls"},
    {id:460, name:"460 - Burnsville-Minneapolis"},
    {id:464, name:"464 - Savage-Burnsville-Minneapolis"},
    {id:465, name:"465 - Burnsville-Minneapolis-U of M"},
    {id:467, name:"467 - Express - Lakeville-Minneapolis"},
    {id:470, name:"470 - Eagan-Minneapolis"},
    {id:472, name:"472 - Eagan Blackhawk-Minneapolis"},
    {id:475, name:"475 - Apple Valley-Cedar Grove-Mpls/U of M"},
    {id:476, name:"476 - Palomino Hills-Minneapolis"},
    {id:477, name:"477 - Lakeville/Apple Valley-Mpls"},
    {id:478, name:"478 - Rosemount-Minneapolis"},
    {id:479, name:"479 - 157th Street-Minneapolis"},
    {id:480, name:"480 - Apple Valley/Burnsville-St Paul"},
    {id:484, name:"484 - Rosemount-Eagan-St Paul"},
    {id:489, name:"489 - St Paul-Eagan Rev Comm"},
    {id:490, name:"490 - Prior Lake-Shakopee-Minneapolis"},
    {id:491, name:"491 - Scott County-Minneapolis Rev Commute"},
    {id:492, name:"492 - Prior Lake-Minneapolis Rev Commute"},
    {id:493, name:"493 - Shakopee-Minneapolis"},
    {id:496, name:"496 - Shakopee Circulator"},
    {id:515, name:"515 - Southdale - 66th St - Bloomington Av - VA - MOA"},
    {id:535, name:"535 - Ltd Stop - South Bloomington - Richfield - Mpls"},
    {id:537, name:"537 - Norm Coll - France Av - York Av - Southdale"},
    {id:538, name:"538 - Southdale - York Av - Southtown - 86th St - MOA"},
    {id:539, name:"539 - Norm Coll - France Av - 98St - MOA"},
    {id:540, name:"540 - Edina - Richfield - 77th St - MOA"},
    {id:542, name:"542 - 84th St - 76th St - American Blvd - MOA"},
    {id:552, name:"552 - Express - 12th Av - Bloomington Av - Mpls"},
    {id:553, name:"553 - Express - Bloomington - Portland Av - Mpls"},
    {id:554, name:"554 - Express - Bloomington - Nicollet Av - Mpls"},
    {id:558, name:"558 - Express - Southtown - Lyndale Av - Penn Av - Mpls"},
    {id:578, name:"578 - Express - Edina - Southdale - Mpls"},
    {id:579, name:"579 - Express - U of M - Southdale"},
    {id:587, name:"587 - Express - Edina - Valley View Rd - Mpls"},
    {id:588, name:"588 - Mpls - Normandale Lake Office Park"},
    {id:589, name:"589 - Express - West Bloomington - Mpls"},
    {id:597, name:"597 - Express - West Bloomington - Mpls"},
    {id:604, name:"604 - Wayzata Blvd - Louisiana Av - Excelsior Blvd"},
    {id:614, name:"614 - Ridgedale - Minnetonka Heights"},
    {id:615, name:"615 - Ridgedale - Co Rd 73 - St Louis Park"},
    {id:643, name:"643 - Ltd Stop - Cedar Lake Rd - Mpls"},
    {id:649, name:"649 - Express - Louisiana Av - Cedar Lake Rd- Mpls"},
    {id:652, name:"652 - Express - Plymouth Rd - Co Rd 73 P&amp;R - U of M"},
    {id:663, name:"663 - Express - Cedar Lake Rd - Mpls"},
    {id:664, name:"664 - Express - Co Rd 3 - Excelsior Blvd - Mpls"},
    {id:667, name:"667 - Express - Minnetonka - St Louis Park - Mpls"},
    {id:668, name:"668 - Express - Hopkins - St Louis Park - Mpls"},
    {id:670, name:"670 - Express - Excelsior - Mpls"},
    {id:671, name:"671 - Express - Excelsior - Deephaven - Mpls"},
    {id:672, name:"672 - Express - Wayzata - Minnetonka - Mpls"},
    {id:673, name:"673 - Express - Co Rd 73 P&amp;R - Mpls"},
    {id:674, name:"674 - Express - Maple Plain -Orono - Wayzata - Mpls"},
    {id:675, name:"675 - Express - Mound - Wayzata - Ridgedale - Mpls"},
    {id:677, name:"677 - Express- Mound - Orono - Plymouth Rd - Mpls"},
    {id:679, name:"679 - Express Co Rd 73  Target Field"},
    {id:684, name:"684 - SW Transit - Express - Eden Prairie - Southdale"},
    {id:687, name:"687 - SW Transit - Express - Eden Prairie - Target N Cam"},
    {id:690, name:"690 - SW Transit - Express - Eden Prairie - Mpls"},
    {id:691, name:"691 - SW Transit - Express - Eden Prairie - Mpls"},
    {id:692, name:"692 - SW Transit - Express - Chanhassen"},
    {id:694, name:"694 - SW Transit - Express - Best Buy - Normandale"},
    {id:695, name:"695 - SW Transit - Express - Chaska - Chanhassen - Mpls"},
    {id:697, name:"697 - SW Transit - Express - Carver-Chaska - Mpls"},
    {id:698, name:"698 - SW Transit - Express - Chaska - Chanhassen - Mpls"},
    {id:699, name:"699 - SW Transit - Express - Chaska - Mpls"},
    {id:705, name:"705 - Starlite - Winnetka Av"},
    {id:716, name:"716 - Zane Av - 63rd Av - Crystal - Robbinsdale"},
    {id:717, name:"717 - Brooklyn Center - Robbinsdale-Plymouth"},
    {id:721, name:"721 - Ltd Stop - Brooklyn Center - New Hope - Mpls"},
    {id:722, name:"722 - Brooklyn Ctr - Humboldt Av N - Shingle Creek Pkwy"},
    {id:723, name:"723 - Starlite - North Henn Comm College - Brooklyn Ctr"},
    {id:724, name:"724 - Ltd Stop - Target Campus - Starlite - Brooklyn Ctr"},
    {id:740, name:"740 - Plymouth - Fernbrook Ln - Xenium Ln"},
    {id:741, name:"741 - Plymouth - Annapolis - Campus Dr - Station 73"},
    {id:742, name:"742 - Plymouth - Express - Bass Lake Rd"},
    {id:747, name:"747 - Plymouth - Express - Station 73 - Mpls"},
    {id:755, name:"755 - Ltd Stop - Hwy 55 - Golden Valley Rd - Winnetka Av"},
    {id:756, name:"756 - Express- Hwy 55 - Mendelssohn Rd - Boone Av"},
    {id:758, name:"758 - Express - Douglas - MnDot P&amp;R - Noble - Mpls"},
    {id:760, name:"760 - Express - Zane Av - 63rd Av - 65th Av P&amp;R - Mpls"},
    {id:761, name:"761 - Express - Brooklyn Park - Xerxes - 49th Av - Mpls"},
    {id:762, name:"762 - Ltd Stop - Brooklyn Ctr - North Mpls - Mpls"},
    {id:763, name:"763 - Express - 85th Av - Brookdale Dr - Humboldt - Mpls"},
    {id:764, name:"764 - Express - Winnetka Av - 42nd Av - Mpls"},
    {id:765, name:"765 - Express - Target - Hwy 252 and 73rd Av P&amp;R - Mpls"},
    {id:766, name:"766 - Express - Champlin - Noble P&amp;R - West River Rd"},
    {id:767, name:"767 - Express - 63rd Av P&amp;R - 65th Av P&amp;R - Mpls"},
    {id:768, name:"768 - Express - Noble P&amp;R - Downtown"},
    {id:771, name:"771 - Plymouth - SW Plymouth - Station 73"},
    {id:772, name:"772 - Plymouth - Express - Station 73"},
    {id:774, name:"774 - Plymouth - Express - Station 73"},
    {id:776, name:"776 - Plymouth - Express - Southwest Plymouth"},
    {id:777, name:"777 - Plymouth - Express - NW Plymouth - Station 73"},
    {id:780, name:"780 - Maple Grove - Express - Shepherd of the Grove P&amp;R"},
    {id:781, name:"781 - Maple Grove - Express - Maple Grove Station"},
    {id:782, name:"782 - Maple Grove - Express - Zachary and 96th Av P&amp;R"},
    {id:783, name:"783 - Maple Grove - Express - Crosswinds Church P&amp;R"},
    {id:785, name:"785 - Maple Grove - Express - Parkway Station"},
    {id:787, name:"787 - Maple Grove - Midday Shuttle - Flex Route"},
    {id:788, name:"788 - Maple Grove - Bass Lake Rd - Crosswinds Church P&amp;R"},
    {id:789, name:"789 - Maple Grove - U of M"},
    {id:790, name:"790 - Plymouth - Express - Cub Foods - Four Seasons"},
    {id:791, name:"791 - Plymouth - Shuttle - Larch Ln - Four Seasons"},
    {id:793, name:"793 - Plymouth - Express - Cub Foods - Four Seasons"},
    {id:795, name:"795 - Plymouth - Express - Midday - Northeast Plymouth"},
    {id:801, name:"801 - Brooklyn Ctr - Columbia Heights - Rosedale"},
    {id:805, name:"805 - Anoka Traveler - Anoka - Coon Rapids - Northtown"},
    {id:824, name:"824 - Ltd Stop - Northtown - Monroe - University - Mpls"},
    {id:825, name:"825 - Ltd Stop - Northtown - St. Anthony - Mpls"},
    {id:831, name:"831 - Anoka Traveler - 117th Av - Polk - Northtown"},
    {id:850, name:"850 - Express - Riverdale P&amp;R - Foley P&amp;R - Mpls"},
    {id:852, name:"852 - Express - Anoka - Coon Rapids - Northtown - Mpls"},
    {id:854, name:"854 - Express - Paul Pkwy - Northdale - Northtown - Mpls"},
    {id:860, name:"860 - Express - Riverdale - Northtown - St Paul"},
    {id:865, name:"865 - Express - Blaine - Ham Lake - East Bethel"},
    {id:887, name:"887 - Express - St Cloud Link"},
    {id:888, name:"888 - Northstar-Big Lk-Elk Rv-Anoka-Coon Rp-Mpls"}
  ],
    selectedOption: {id: 0, name: "Select a route!"}
  };
}]);
