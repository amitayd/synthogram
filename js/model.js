function ModelProperty(name, value, changeListeners) {
  this.name = name;
  this.value = value;
  this.changeListeners = changeListeners;
}

ModelProperty.prototype.set = function(value) {
  this.value = value;
  var listeners = this.changeListeners;
  for (var i = 0; i < listeners.length; i++) {
      listeners[i].call(this, this.value);
  }
};

ModelProperty.prototype.get = function() {
  return this.value;
}


ModelProperty.prototype.addChangeListener = function(listener) {
  this.changeListeners.push(listener);
};


function Model(defaultProperties) {
  this.properties = defaultProperties;

  for (var propName in defaultProperties) {
    var value = defaultProperties[propName];
    this.properties[propName] = new ModelProperty(propName, value, []);
  }
}

Model.prototype.get = function(propName) {
  if (!(propName in this.properties)) {
    throw new Error('property ' + propName + ' not in model.');
  } 
  
  return this.properties[propName];
};

Model.prototype.getVal = function(propName) {
  return this.get(propName).get();
};

Model.prototype.getProps = function(propertyNames) {
  var properties = {};

  for (var propName in this.properties) {
    properties[propName] = this.get(propName);
  };

  return properties;
};




