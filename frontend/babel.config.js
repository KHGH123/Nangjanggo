module.exports = function (api) {
    const isTest = api.env('test');
    api.cache(!isTest);

    if (isTest) {
        return {
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
            plugins: [
                ['module-resolver', { root: ['./src'], alias: { '@': './src' } }],
            ],
        };
    }

    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./src'],
                    alias: {
                        '@': './src',
                    },
                },
            ],
        ],
    };
};