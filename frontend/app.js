angular.module('imageApp', ['ngRoute'])
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        template: `
          <h1>Image Storage System</h1>
          <button ng-click="goToUpload()">Upload Image</button>
          <button ng-click="goToRead()">Read Image</button>
        `,
        controller: 'HomeController'
      })
      .when('/upload', {
        templateUrl: 'upload.html',
        controller: 'UploadController'
      })
      .when('/read', {
        templateUrl: 'read.html',
        controller: 'ReadController'
      })
      .otherwise({ redirectTo: '/' });
  })
  .service('ImageService', function($http) {
    const apiUrl = 'http://localhost:3000';
    
    this.uploadImage = function(file, name) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', name);
      
      return $http.post(`${apiUrl}/images`, formData, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      });
    };
    
    this.getImage = function(name) {
      return $http.get(`${apiUrl}/images/${name}`, {
        responseType: 'arraybuffer'
      });
    };
  })
  .controller('HomeController', function($scope, $location) {
    $scope.goToUpload = function() {
      $location.path('/upload');
    };
    
    $scope.goToRead = function() {
      $location.path('/read');
    };
  })
  .controller('UploadController', function($scope, ImageService, $location) {
    $scope.image = null;
    $scope.name = '';
    $scope.uploading = false;
    $scope.result = null;
    
    $scope.onFileSelect = function(files) {
      $scope.image = files[0];
    };
    
    $scope.upload = function() {
      if (!$scope.image || !$scope.name) {
        alert('Please select an image and enter a name');
        return;
      }
      
      $scope.uploading = true;
      $scope.result = null;
      
      ImageService.uploadImage($scope.image, $scope.name)
        .then(function(response) {
          $scope.result = {
            success: true,
            message: 'Upload successful!',
            imageUrl: response.data.imageUrl
          };
          $scope.uploading = false;
        })
        .catch(function(error) {
          $scope.result = {
            success: false,
            message: 'Upload failed: ' + error.data.error
          };
          $scope.uploading = false;
        });
    };
    
    $scope.goBack = function() {
      $location.path('/');
    };
  })
  .controller('ReadController', function($scope, ImageService) {
    $scope.name = '';
    $scope.loading = false;
    $scope.imageData = null;
    $scope.error = null;
    
    $scope.getImage = function() {
      if (!$scope.name) {
        alert('Please enter an image name');
        return;
      }
      
      $scope.loading = true;
      $scope.imageData = null;
      $scope.error = null;
      
      ImageService.getImage($scope.name)
        .then(function(response) {
          const arrayBufferView = new Uint8Array(response.data);
          const blob = new Blob([arrayBufferView], { type: response.headers('Content-Type') });
          $scope.imageData = URL.createObjectURL(blob);
          $scope.loading = false;
        })
        .catch(function(error) {
          $scope.error = 'Error: ' + (error.data || 'Image not found');
          $scope.loading = false;
        });
    };
    
    $scope.goBack = function() {
      $location.path('/');
    };
  });