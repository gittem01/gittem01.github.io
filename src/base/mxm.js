// a basic matrix generator for a sample

function vecDot(vec1, vec2)
{
    return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
}

function cross(vec1, vec2)
{
    return new Float32Array([
        vec1[1] * vec2[2] - vec2[1] * vec1[2],
        vec1[2] * vec2[0] - vec2[2] * vec1[0],
        vec1[0] * vec2[1] - vec2[0] * vec1[1]
    ]);
}

function normalizeVec(vec)
{
    var result = vec;
    var mag = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    result[0] /= mag;
    result[1] /= mag;
    result[2] /= mag;
    return result;
}

export function lookAtMatrix(pos, lookPos)
{
    var xCam = [lookPos[0] - pos[0], lookPos[1] - pos[1], lookPos[2] - pos[2]];
    xCam = normalizeVec(xCam);
    
    var wup = [0, 1, 0];
    var zCam = normalizeVec(cross(xCam, wup));
    
    var yCam = cross(zCam, xCam);

    // column major view matrix
    return new Float32Array(
        [
            xCam[0],    yCam[0],    zCam[0],    0.0,
            xCam[1],    yCam[1],    zCam[1],    0.0,
            xCam[2],    yCam[2],    zCam[2],    0.0,
            -vecDot(xCam, pos), -vecDot(yCam, pos), -vecDot(zCam, pos), 1.0,
        ]
    )
}