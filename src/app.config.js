const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = {
    appName: 'Training Plan App',
    cacheType: isProduction ? 's3' : 's3',
    dbName: 'trainingPlanDb'
};
