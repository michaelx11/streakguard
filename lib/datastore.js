var DATASTORE = require('@google-cloud/datastore')({
  projectId: process.env.PROJECT_ID
});

module.exports.getUser = function(userId, cbErrorEntities) {
  var query = DATASTORE.createQuery('SnapAccount')
                .filter('enabled', true)
                .filter('user', userId);
   query.run(function(err, entities, info) {
     if (err) {
       cbErrorEntities(err, []);
       return;
     }
     cbErrorEntities(false, entities);
   });
};

module.exports.getAllEnabledAccounts = function(cbErrorEntities) {
  var query = DATASTORE.createQuery('SnapAccount')
                .filter('enabled', true);
   query.run(function(err, entities, info) {
     if (err) {
       cbErrorEntities(err, []);
       return;
     }
     cbErrorEntities(false, entities);
   });
};

module.exports.updateTimestamp = function(snapAccountEntity, cbError) {
  var transaction = DATASTORE.transaction();

  transaction.run(function(err) {
    if (err) {
      cbError(err);
      return;
    }

    var key = snapAccountEntity[DATASTORE.key];

    transaction.get(key, function(err, snapAccountEntity) {
      if (err) {
        cbError(err);
        return;
      }

      snapAccountEntity['last_refreshed'] = new Date();
      transaction.save(entity);

      transaction.commit(function(err) {
        if (!err) {
          cbError(false);
          return;
        } else {
          cbError(err);
          return;
        }
      });
    });
  });
};

module.exports.getTrustedContacts = function(userId, cbErrorEntities) {
  var query = DATASTORE.createQuery('TrustedContact')
                .filter('linked_user', userId);
  query.run(function(err, entities, info) {
    if (err) {
      cbErrorEntities(err, []);
      return;
    }
    cbErrorEntities(false, entities);
  });
};
