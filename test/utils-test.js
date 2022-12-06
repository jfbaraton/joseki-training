var expect = require("chai").expect;
var tenuki = require("../index.js");
var utils = tenuki.utils;

const allTransforms = utils.getAllPossibleTransform();

let R16 = {y:3,x:16};
let pass = {pass:true};

let R4  = {y: 15, x: 16};
let C16 = {y: 3, x: 2};
let C4  = {y: 15, x: 2};
let Q17 = {y: 2, x: 15};
let Q3  = {y: 16, x: 15};
let D17 = {y: 2, x: 3};
let D3  = {y: 16, x: 3};

let R17 = {y:2,x:16};
let Q16 = {y:3,x:15}; // top right hoshi

let tengen= {y:9,x:9};

describe("Utils", function() {
    // diagonal means symmetry along bot-left to top-right diagonal
    // horizontal means symmetry that transforms left to right
    // vertical means symmetry that transforms top to bottom
    /*const ALL_POSSIBLE_TRANSFORMS = [
        {diagonal:false, horizontal:false, vertical: false }, // identity, does not change anything
        {diagonal:false, horizontal:false, vertical: true  }, // R16 -> R4
        {diagonal:false, horizontal:true , vertical: false }, // R16 -> C16
        {diagonal:false, horizontal:true , vertical: true  }, // R16 -> C4
        {diagonal:true , horizontal:false, vertical: false }, // R16 -> Q17
        {diagonal:true , horizontal:false, vertical: true  }, // R16 -> Q3
        {diagonal:true , horizontal:true , vertical: false }, // R16 -> D17
        {diagonal:true , horizontal:true , vertical: true  }  // R16 -> D3
    ];*/
  describe("transforms", function() {
    it("Identity transform move", function() {
        // identity, does not change anything
        let transformed = utils.transformMove(R16, allTransforms[0]);
        expect(transformed.pass).to.equal(R16.pass);
        expect(transformed.x).to.equal(R16.x);
        expect(transformed.y).to.equal(R16.y);
    });
    it("Identity transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[0]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
    it("R16 -> R4 transform move", function() {
        let transformed = utils.transformMove(R16, allTransforms[1]);
        expect(transformed.pass).to.equal(R4.pass);
        expect(transformed.x).to.equal(R4.x);
        expect(transformed.y).to.equal(R4.y);
    });
    it("R16 -> R4 transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[1]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
    it("R16 -> C16 transform move", function() {
        let transformed = utils.transformMove(R16, allTransforms[2]);
        expect(transformed.pass).to.equal(C16.pass);
        expect(transformed.x).to.equal(C16.x);
        expect(transformed.y).to.equal(C16.y);
    });
    it("R16 -> C16 transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[2]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
    it("R16 -> C4 transform move", function() {
        let transformed = utils.transformMove(R16, allTransforms[3]);
        expect(transformed.pass).to.equal(C4.pass);
        expect(transformed.x).to.equal(C4.x);
        expect(transformed.y).to.equal(C4.y);
    });
    it("R16 -> C4 transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[3]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
    it("R16 -> Q17 transform move", function() {
        let transformed = utils.transformMove(R16, allTransforms[4]);
        expect(transformed.pass).to.equal(Q17.pass);
        expect(transformed.x).to.equal(Q17.x);
        expect(transformed.y).to.equal(Q17.y);
    });
    it("R16 -> Q17 transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[4]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
    it("R16 -> Q3 transform move", function() {
        let transformed = utils.transformMove(R16, allTransforms[5]);
        expect(transformed.pass).to.equal(Q3.pass);
        expect(transformed.x).to.equal(Q3.x);
        expect(transformed.y).to.equal(Q3.y);
    });
    it("R16 -> Q3 transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[5]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
    it("R16 -> D17 transform move", function() {
        let transformed = utils.transformMove(R16, allTransforms[6]);
        expect(transformed.pass).to.equal(D17.pass);
        expect(transformed.x).to.equal(D17.x);
        expect(transformed.y).to.equal(D17.y);
    });
    it("R16 -> D17 transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[6]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
    it("R16 -> D3 transform move", function() {
        let transformed = utils.transformMove(R16, allTransforms[7]);
        expect(transformed.pass).to.equal(D3.pass);
        expect(transformed.x).to.equal(D3.x);
        expect(transformed.y).to.equal(D3.y);
    });
    it("R16 -> D3 transform PASS", function() {
        // pass, does not change anything
        let transformedPass = utils.transformMove(pass, allTransforms[7]);
        expect(transformedPass.pass).to.equal(pass.pass);
        expect(transformedPass.x).to.equal(pass.x);
        expect(transformedPass.y).to.equal(pass.y);
    });
  });
  describe("getPossibleTransforms ", function() {
    it("all transforms transform PASS->PASS", function() {
        const allAvailableTransforms = utils.getAllPossibleTransform();
        let possibleTransforms = utils.getPossibleTransforms(pass, pass, allAvailableTransforms);
        expect(possibleTransforms.length).to.equal(8);
    });
    it("no transform transforms R16->PASS", function() {
        const allAvailableTransforms = utils.getAllPossibleTransform();
        let possibleTransforms = utils.getPossibleTransforms(R16, pass, allAvailableTransforms);
        expect(possibleTransforms).to.equal(null);
    });
    it("no transform transforms R16->R17", function() {
        const allAvailableTransforms = utils.getAllPossibleTransform();
        let possibleTransforms = utils.getPossibleTransforms(R16, R17, allAvailableTransforms);
        expect(possibleTransforms).to.equal(null);
    });
    it("only identity transforms R16->R16", function() {
        const allAvailableTransforms = utils.getAllPossibleTransform();
        let possibleTransforms = utils.getPossibleTransforms(R16, R16, allAvailableTransforms);
        expect(possibleTransforms.length).to.equal(1);
        expect(possibleTransforms[0]).to.equal(allAvailableTransforms[0]);
    });
    it("only diagonal transforms R16->Q17", function() {
        const allAvailableTransforms = utils.getAllPossibleTransform();
        let possibleTransforms = utils.getPossibleTransforms(R16, Q17, allAvailableTransforms);
        expect(possibleTransforms.length).to.equal(1);
        expect(allAvailableTransforms.length).to.equal(8);
        expect(possibleTransforms[0]).to.equal(allAvailableTransforms[4]);
    });
    it("both Id and diag transform Q16->Q16", function() {
        const allAvailableTransforms = utils.getAllPossibleTransform();
        let possibleTransforms = utils.getPossibleTransforms(Q16, Q16, allAvailableTransforms);
        expect(possibleTransforms.length).to.equal(2);
        expect(possibleTransforms[0]).to.equal(allAvailableTransforms[0]);
        expect(possibleTransforms[1]).to.equal(allAvailableTransforms[4]);
    });
    it("all transforms transform tengen->tengen", function() {
        const allAvailableTransforms = utils.getAllPossibleTransform();
        let possibleTransforms = utils.getPossibleTransforms(tengen, tengen, allAvailableTransforms);
        expect(possibleTransforms.length).to.equal(8);
    });
  });

});
