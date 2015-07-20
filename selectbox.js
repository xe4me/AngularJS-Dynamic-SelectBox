define(["app"], function(app) {

    app.filter('myFilter', [function() {
        return function(input, q) {
            var finals = [];
            input.map(function(elem, index) {
                if (elem.cat.search(new RegExp(q, "gi")) > -1) {
                    finals.push(elem);
                }
            });

            return finals;
        };
    }]);


    app.directive('selectbox', ['$sce', '$http', '$compile', '$filter', '$document', function($sce, $http, $compile, $filter, $document) {
        var quieryApi = function(q, $scope, isHighlight) {
            $scope.showloading = true;
            $http({
                url: $scope.apiAddress,
                method: "GET",
                params: {
                    q: q
                }
            }).success(function(data) {
                if (isHighlight) {
                    angular.forEach(data.extra, function(value, key) {
                        var index = value.cat.indexOf(q);
                        var result = value.cat.insert(index, "<strong>");
                        index = result.indexOf(q);
                        var result = result.insert(index + q.length, "</strong>");
                        data.extra[key].cat = result;
                    });
                }

                $scope.showloading = false;
                $scope.cats = data.extra;
            })
        };

        return {
            transclude: true,
            scope: {
                options: "=",
                initialOpen: "@",
                apiAddress: "@",
                searchPlaceholder: "@",
                selectedObjectArray: "=selectedObjectArray",
                initialSearchApi: "@"
            },
            controller: [
                '$scope', '$element', '$attrs', '$transclude',
                function($scope, $element, $attrs, $transclude) {
                    var hastTranscludedItems = false;

                    function addToCats(key, value) {
                        $scope.cats.push({
                            _id: "id_" + key,
                            cat: value
                        });
                        cats.push({
                            _id: "id_" + key,
                            cat: value
                        });

                    }

                    $scope.title = $attrs.title;
                    if (!$scope.searchPlaceholder) {
                        $scope.searchPlaceholder = "Start typing ...";
                    }
                    $scope.status = {
                        isopen: false
                    };
                    $scope.dropdown = function() {

                        $scope.status.isopen = !$scope.status.isopen;
                    }
                    var docClickHandler = function(event) {
                        $scope.status.isopen = false;
                        event.preventDefault();
                        $scope.$apply();
                    };
                    //$document.on("click",docClickHandler);
                    /*$scope.$on('$destroy', function(){
                          $document.off('click', docClickHandler);
                        });*/

                    var myFilter = $filter("myFilter");
                    var preFilterItems = [];
                    var multiple = false;
                    $scope.cats = [];
                    var cats = [];
                    $scope.q = "";

                    $scope.showloading = false;
                    var addedTags = 0;
                    var notAddedTags = 0;
                    var notAddedTagsItems = [];
                    var toggleDiv, tagsWrapper, toggleDivWidth, tagsWrapperWidth;

                    // First get all attrs and initialize
                    if ($scope.initialOpen == "true") {
                        $scope.status.isopen = true;
                    }

                    if ($attrs.multiple != undefined) {
                        multiple = true;
                    }


                    if (!$scope.apiAddress) {

                        if ($scope.options) {

                            if (typeof($scope.options[0]) === 'object') {
                                var k;
                                for (var index in $scope.options[0]) { // First we must know what is the key in each item object
                                    k = index;
                                    break;
                                };
                                // Why we do this ? because in our ng-options we've specifed a cat.cat , which we're not sure if the array that comes from the api 
                                // is like that . so we need to simply transorm the object into our desired objects
                                for (var i = 0; i < $scope.options.length; i++) { // Then we can loop and get the object that what we actually need

                                    addToCats(k, $scope.options[i][k]);

                                }
                            } else {
                                for (var i = 0; i < $scope.options.length; i++) {
                                    addToCats(i, $scope.options[i]);
                                }
                            }

                        }

                        $transclude(function(clone, scope) {
                            angular.forEach(clone, function(elem, index) {
                                if (elem != "" && elem.nodeName.toLowerCase() === "option") {
                                    hastTranscludedItems = true;
                                    addToCats(elem.value, elem.innerHTML);
                                }
                            });
                        });

                    }




                    $scope.remove = function(id, $event) {
                        $event.stopPropagation()
                        $scope.selectedObjectArray.forEach(function(element, index) {
                            if (id === element._id) {
                                $scope.cats.push(element);
                                $scope.selectedObjectArray.splice(index, 1);
                            }
                        });

                        angular.element(document.querySelector('span#item_' + id)).remove();
                        tagsWrapperWidth = tagsWrapper[0].offsetWidth;
                        if (notAddedTagsItems.length > 0 && tagsWrapperWidth < (toggleDivWidth - 300)) {

                            $el = '<span id="item_' + notAddedTagsItems[0]._id + '" class="tag">' + notAddedTagsItems[0].cat + '<span ng-click=remove("' + notAddedTagsItems[0]._id + '",$event) class="remove"> x </span></span>';
                            tagsWrapper.prepend($compile($el)($scope));
                            notAddedTagsItems.splice(0, 1);
                            notAddedTags--;
                            addedTags++;
                            if (notAddedTags > 0) {
                                angular.element(document.querySelector('span#notAddedTags')).html(" " + notAddedTags + " more selected");
                            } else {
                                angular.element(document.querySelector('span#notAddedTags')).remove();
                            }
                        }
                        if ($scope.selectedObjectArray.length === 0) {
                            $scope.title = $attrs.title;
                        }
                        return false;
                    }

                    $scope.addItem = function(item) {

                        if (toggleDiv === undefined) {
                            toggleDiv = angular.element(document.querySelector('div.togglerdiv'));
                            toggleDivWidth = toggleDiv[0].offsetWidth;
                        }
                        if (tagsWrapper === undefined) {
                            tagsWrapper = angular.element(document.querySelector('div.tagsWrapper'));
                        }
                        tagsWrapperWidth = tagsWrapper[0].offsetWidth;

                        if (multiple) {
                            // First , add this new Item to selected Items 
                            $scope.selectedObjectArray.push(item);
                            // Then remove this item from all Items ==> means from $scope.cats

                            if (tagsWrapperWidth < (toggleDivWidth - 300)) {
                                addedTags++;

                                $el = $compile('<span id="item_' + item._id + '" class="tag">' + item.cat + '<span ng-click=remove("' + item._id + '",$event)   class="remove"> x </span></span>')($scope);

                                tagsWrapper.append($el);

                            } else {
                                notAddedTagsItems.push(item);
                                if (notAddedTags > 0) {
                                    notAddedTags++;
                                    angular.element(document.querySelector('span#notAddedTags')).html(" " + notAddedTags + " more selected");
                                } else {
                                    notAddedTags++;
                                    tagsWrapper.append('<span id="notAddedTags"> ' + notAddedTags + ' more selected</span>');
                                }
                            }
                            $scope.title = "";

                        } else {

                            // First , add this new Item to selected Items 
                            if ($scope.selectedObjectArray[0]) {
                                $scope.cats.push($scope.selectedObjectArray[0]);
                            }
                            $scope.selectedObjectArray[0] = item;

                            //$scope.title = $sce.trustAsHtml(item.cat);
                            $scope.title = item.cat;


                        }
                        $scope.cats.forEach(function(element, index) {
                            if (element._id === item._id && element.cat === item.cat) {
                                $scope.cats.splice(index, 1);
                                return;
                            }
                        });

                    }

                    if ($attrs.preselected) {
                        if (isNaN($attrs.preselected)) {
                            $scope.cats.forEach(function(element, index) {
                                if (element._id === $attrs.preselected || element.cat === $attrs.preselected) {
                                    $scope.addItem(element);
                                    return;
                                }
                            });
                        } else {

                            $scope.addItem($scope.cats[$attrs.preselected]);
                        }

                    }
                    $scope.search = function(keyEvent) {
                        if (keyEvent.keyCode == 32) { // if the key is backspace , do nothing
                            return;
                        }
                        var q = $scope.q.trim();
                        if (q == "") {
                            if ($scope.options) {
                                $scope.cats = myFilter(cats, q, preFilterItems);
                            }
                            return;
                        }
                        if (keyEvent.keyCode == 40) { // if user has pressed down arrow key			
                            var ul = angular.element(document.querySelector('ul.resultlist'));
                            //$log.info(ul.children()[0].triggerHandler('click'));

                        } else {
                            if ($scope.options || hastTranscludedItems) {

                                $scope.cats = myFilter(cats, q, preFilterItems);

                            } else {
                                quieryApi(q, $scope, true);
                            }
                        }
                    }

                    if ($scope.apiAddress) { // This means this selext box wants to connect to API for it's options
                        // if user wants to get some options when this selexbox is created , from Api !
                        if ($scope.initialSearchApi) {
                            quieryApi($scope.initialSearchApi, $scope, false);
                        }
                    }


                }
            ],
            restrict: 'E',
            templateUrl: 'app/views/components/selectbox.html',
            replace: true,
            link: function($scope, elem, attrs) {
                elem.bind("click", function() {
                    elem[0].querySelector('input#selectboxinput').focus();
                });
            }
        };
    }]);


});
