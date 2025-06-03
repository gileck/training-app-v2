const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true';

export const appConfig = {
    appName: 'Training Plan App',
    cacheType: isProduction ? 's3' : 's3',
    dbName: isTest ? 'trainingPlanDb_test' : 'trainingPlanDb'
};
